import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestBody = await req.json().catch(() => ({}));
    const notificationType = requestBody.type;
    const memberId = requestBody.member_id;
    const daysBeforeExpiry = requestBody.days_before || 5;

    if (!notificationType || (!memberId && notificationType !== 'expiry_bulk')) {
      return new Response(JSON.stringify({ error: 'Missing notification type or member ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      return new Response(JSON.stringify({ error: 'SMS service not configured. Please contact administrator.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let members = [];
    let gyms = {};

    if ((notificationType === 'welcome' || notificationType === 'expiry') && memberId) {
      // Get member details including the user_id (formatted member ID)
      const { data: member, error: memberError } = await supabaseClient
        .from('members')
        .select('id, user_id, name, phone, gym_id, plan, plan_expiry_date, join_date, status')
        .eq('id', memberId)
        .eq('status', 'active')
        .single();

      if (memberError || !member) {
        console.error('Member not found:', memberError);
        return new Response(JSON.stringify({ error: 'Member not found or inactive' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log('Found member:', member);
      members = [member];
    } else if (notificationType === 'expiry_bulk') {
      const { data: expiringMembers, error: membersError } = await supabaseClient.rpc('get_expiring_members', {
        days_before: daysBeforeExpiry
      });

      if (membersError) {
        console.error('Error fetching expiring members:', membersError);
        return new Response(JSON.stringify({ error: 'Failed to fetch expiring members' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // For bulk expiry, we need to get the full member details including user_id
      if (expiringMembers && expiringMembers.length > 0) {
        const memberIds = expiringMembers.map(m => m.member_id);
        const { data: fullMembers, error: fullMembersError } = await supabaseClient
          .from('members')
          .select('id, user_id, name, phone, gym_id, plan, plan_expiry_date')
          .in('id', memberIds)
          .eq('status', 'active');

        if (fullMembersError) {
          console.error('Error fetching full member details:', fullMembersError);
          return new Response(JSON.stringify({ error: 'Failed to fetch member details' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        members = fullMembers || [];
      }
    }

    if (members.length === 0) {
      return new Response(JSON.stringify({ message: 'No members found for notification', count: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get gym details
    const uniqueGymIds = [...new Set(members.map((m) => m.gym_id))];
    const { data: gymData } = await supabaseClient.from('gyms').select('id, name').in('id', uniqueGymIds);
    if (gymData) {
      gymData.forEach((gym) => {
        gyms[gym.id] = gym;
      });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const member of members) {
      try {
        const gymName = gyms[member.gym_id]?.name || 'Your Gym';

        // Format phone number
        let phoneNumber = member.phone.replace(/\D/g, '');
        if (phoneNumber.startsWith('91') && phoneNumber.length === 12) {
          phoneNumber = '+' + phoneNumber;
        } else if (phoneNumber.length === 10) {
          phoneNumber = '+91' + phoneNumber;
        } else if (phoneNumber.startsWith('1') && phoneNumber.length === 11) {
          phoneNumber = '+' + phoneNumber;
        } else if (!phoneNumber.startsWith('+')) {
          phoneNumber = '+' + phoneNumber;
        }

        if (phoneNumber.length < 10) {
          errors.push(`Invalid phone number for ${member.name}`);
          errorCount++;
          continue;
        }

        // Create message using user_id (formatted member ID) instead of internal id
        let message;
        if (notificationType === 'welcome') {
          let expiryDate = 'N/A';
          if (member.plan_expiry_date) {
            const d = new Date(member.plan_expiry_date);
            const month = d.getMonth() + 1;
            const day = d.getDate();
            const year = d.getFullYear();
            expiryDate = `${month}/${day}/${year}`;
          }
          message = `Fit Lynk: Welcome ${member.name}!\nID: ${member.user_id}\nPlan: ${member.plan}\nExpiry: ${expiryDate}`;
        } else {
          let expiryDate = 'N/A';
          if (member.plan_expiry_date) {
            const d = new Date(member.plan_expiry_date);
            const month = d.getMonth() + 1;
            const day = d.getDate();
            const year = d.getFullYear();
            expiryDate = `${month}/${day}/${year}`;
          }
          message = `Fit Lynk: Hi ${member.name}!\nID: ${member.user_id}\nPlan: ${member.plan}\nExpiry: ${expiryDate}`;
        }

        console.log('Sending SMS message:', message);

        // Truncate message if too long for trial accounts
        if (message.length > 150 && Deno.env.get('TWILIO_ACCOUNT_SID')?.startsWith('AC')) {
          message = message.slice(0, 150);
        }

        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
        const twilioAuth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

        const twilioResponse = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${twilioAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            From: twilioPhoneNumber,
            To: phoneNumber,
            Body: message
          })
        });

        const responseData = await twilioResponse.text();
        console.log('Twilio response:', responseData);

        if (twilioResponse.ok) {
          // Mark notification as sent for expiry notifications
          if (notificationType.includes('expiry')) {
            await supabaseClient.rpc('mark_notification_sent', { member_id: member.id });
          }
          successCount++;
          console.log(`✅ SMS sent successfully to ${member.name} (${member.user_id})`);
        } else {
          console.error(`❌ Failed to send SMS to ${member.name}:`, responseData);
          errors.push(`Failed to send to ${member.name}: ${responseData}`);
          errorCount++;
        }

        // Add delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Error processing ${member.name}:`, error);
        errors.push(`Error processing ${member.name}: ${error.message}`);
        errorCount++;
      }
    }

    return new Response(JSON.stringify({
      message: `SMS notifications processed`,
      type: notificationType,
      total_members: members.length,
      successful_notifications: successCount,
      failed_notifications: errorCount,
      errors: errors.length > 0 ? errors : undefined
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});