import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Member {
  id: string;
  name: string;
  phone: string;
  gym_id: string;
  plan: string;
  plan_expiry_date: string;
  join_date: string;
}

interface Gym {
  id: string;
  name: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || '',
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ''
    );

    const body = await req.json();
    const notificationType = body.type; // 'welcome' or 'expiry' or 'expiry_bulk'
    const memberId = body.member_id;
    const daysBeforeExpiry = body.days_before || 5;

    console.log('SMS Notification request:', { notificationType, memberId, daysBeforeExpiry });

    // Get Twilio credentials from environment
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.error('Twilio credentials not found');
      return new Response(JSON.stringify({ error: 'Twilio credentials not configured' }), { status: 500, headers: corsHeaders });
    }

    let members: Member[] = [];
    let gyms: { [key: string]: Gym } = {};

    if (notificationType === 'welcome' && memberId) {
      // Get specific member for welcome message
      const { data: member, error: memberError } = await supabaseClient
        .from('members')
        .select('*')
        .eq('id', memberId)
        .single();

      if (memberError || !member) {
        console.error('Error fetching member:', memberError);
        return new Response(JSON.stringify({ error: 'Member not found' }), { status: 404, headers: corsHeaders });
      }

      members = [member];
    } else if (notificationType === 'expiry' && memberId) {
      // Get specific member for expiry reminder
      const { data: member, error: memberError } = await supabaseClient
        .from('members')
        .select('*')
        .eq('id', memberId)
        .single();

      if (memberError || !member) {
        console.error('Error fetching member:', memberError);
        return new Response(JSON.stringify({ error: 'Member not found' }), { status: 404, headers: corsHeaders });
      }

      members = [member];
    } else if (notificationType === 'expiry_bulk') {
      // Get all members whose plans expire in specified days
      const { data: expiringMembers, error: membersError } = await supabaseClient
        .rpc('get_expiring_members', { days_before: daysBeforeExpiry });

      if (membersError) {
        console.error('Error fetching expiring members:', membersError);
        return new Response(JSON.stringify({ error: 'Failed to fetch expiring members' }), { status: 500, headers: corsHeaders });
      }

      // Convert to Member format
      members = (expiringMembers || []).map((m: any) => ({
        id: m.member_id,
        name: m.member_name,
        phone: m.member_phone,
        gym_id: m.gym_id,
        plan: m.plan_name,
        plan_expiry_date: m.expiry_date,
        join_date: ''
      }));
    }

    if (members.length === 0) {
      return new Response(JSON.stringify({ message: 'No members found for notification', type: notificationType }), { status: 200, headers: corsHeaders });
    }

    const uniqueGymIds = [...new Set(members.map(m => m.gym_id))];
    const { data: gymData } = await supabaseClient
      .from('gyms')
      .select('id, name')
      .in('id', uniqueGymIds);

    if (gymData) {
      gymData.forEach((gym: Gym) => {
        gyms[gym.id] = gym;
      });
    }

    let successCount = 0;
    let errorCount = 0;

    // Send SMS to each member
    for (const member of members) {
      try {
        const gymName = gyms[member.gym_id]?.name || 'Your Gym';

        // Format phone number for Twilio (ensure it has country code)
        let phoneNumber = member.phone.replace(/\D/g, '');
        if (!phoneNumber.startsWith('91') && phoneNumber.length === 10) {
          phoneNumber = '91' + phoneNumber; // Add US country code
        }
        if (!phoneNumber.startsWith('+')) {
          phoneNumber = '+' + phoneNumber;
        }

        // Compute displayId before message templates
        const displayId = member.id;

        let message: string;
        if (notificationType === 'welcome') {
          let expiryDate = 'N/A';
          if (member.plan_expiry_date) {
            const d = new Date(member.plan_expiry_date);
            const month = d.getMonth() + 1;
            const day = d.getDate();
            const year = d.getFullYear();
            expiryDate = `${month}/${day}/${year}`;
          }
          message =
            `Fit Lynk: Welcome ${member.name}!\n` +
            `ID: ${member.user_id || displayId}\n` +
            `Plan: ${member.plan}\n` +
            `Expiry: ${expiryDate}`;
        } else {
          let expiryDate = 'N/A';
          if (member.plan_expiry_date) {
            const d = new Date(member.plan_expiry_date);
            const month = d.getMonth() + 1;
            const day = d.getDate();
            const year = d.getFullYear();
            expiryDate = `${month}/${day}/${year}`;
          }
          message =
            `Fit Lynk: Hi ${member.name}!\n` +
            `ID: ${member.user_id || displayId}\n` +
            `Plan: ${member.plan}\n` +
            `Expiry: ${expiryDate}`;
        }

        // Send SMS using Twilio API
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
        const twilioAuth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

        const twilioResponse = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${twilioAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: twilioPhoneNumber,
            To: phoneNumber,
            Body: message
          })
        });

        if (twilioResponse.ok) {
          // Mark notification as sent for expiry notifications
          if (notificationType.includes('expiry')) {
            await supabaseClient.rpc('mark_notification_sent', {
              member_id: member.id
            });
          }

          successCount++;
          console.log(`✅ SMS sent to ${member.name} (${phoneNumber})`);
        } else {
          const errorData = await twilioResponse.text();
          console.error(`❌ Failed to send SMS to ${member.name}: ${errorData}`);
          errorCount++;
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Error processing member ${member.name}:`, error);
        errorCount++;
      }
    }

    console.log(`✅ SMS notification process completed. Success: ${successCount}, Errors: ${errorCount}`);

    return new Response(JSON.stringify({
      message: `SMS notifications processed`,
      type: notificationType,
      total_members: members.length,
      successful_notifications: successCount,
      failed_notifications: errorCount
    }), { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: corsHeaders });
  }
});
