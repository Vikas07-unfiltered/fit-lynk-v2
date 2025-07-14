import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExpiringMember {
  member_id: string;
  member_name: string;
  member_phone: string;
  gym_id: string;
  plan_name: string;
  expiry_date: string;
}

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

app.options("/", (req, res) => {
  res.set(corsHeaders).send("ok");
});

app.post("/", async (req, res) => {
  try {
    const requestBody = req.body || {};
    const isIndividualNotification = requestBody.individual_notification === true;
    const specificMemberId = requestBody.member_id;

    let expiringMembers: ExpiringMember[] = [];

    if (isIndividualNotification && specificMemberId) {
      const { data: member, error: memberError } = await supabase
        .from("members")
        .select("id, name, phone, gym_id, plan, plan_expiry_date")
        .eq("id", specificMemberId)
        .eq("status", "active")
        .single();

      if (memberError) {
        return res.status(500).set(corsHeaders).json({ error: "Failed to fetch member" });
      }

      if (member) {
        expiringMembers = [
          {
            member_id: member.id,
            member_name: member.name,
            member_phone: member.phone,
            gym_id: member.gym_id,
            plan_name: member.plan,
            expiry_date: member.plan_expiry_date,
          },
        ];
      }
    } else {
      const { data, error: membersError } = await supabase.rpc("get_expiring_members", { days_before: 5 });
      if (membersError) {
        return res.status(500).set(corsHeaders).json({ error: "Failed to fetch expiring members" });
      }
      expiringMembers = data || [];
    }

    if (!expiringMembers || expiringMembers.length === 0) {
      return res.status(200).set(corsHeaders).json({
        message: isIndividualNotification
          ? "Member not found or already notified"
          : "No expiring memberships found",
        count: 0,
      });
    }

    const whatsappToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!whatsappToken || !whatsappPhoneNumberId) {
      return res.status(500).set(corsHeaders).json({ error: "WhatsApp credentials not configured" });
    }

    let successCount = 0;
    let errorCount = 0;

    for (const member of expiringMembers) {
      try {
        const { data: gym } = await supabase
          .from("gyms")
          .select("name")
          .eq("id", member.gym_id)
          .single();
        const gymName = gym?.name || "Your Gym";

        let phoneNumber = member.member_phone.replace(/\D/g, "");
        if (!phoneNumber.startsWith("91") && phoneNumber.length === 10) {
          phoneNumber = "91" + phoneNumber;
        }

        let message: string;
        if (isIndividualNotification) {
          message = `🏋️ Hi ${member.member_name}!\n\nThis is a friendly reminder from ${gymName}.\n\nYour ${member.plan_name} membership ${member.expiry_date ? `expires on ${new Date(member.expiry_date).toLocaleDateString()}` : "requires attention"}.\n\nPlease contact us if you need any assistance or have questions about your membership.\n\nThank you for being a valued member! 💪`;
        } else {
          message = `🏋️ Hi ${member.member_name}!\n\nYour ${member.plan_name} membership at ${gymName} is expiring on ${new Date(member.expiry_date).toLocaleDateString()}.\n\nTo continue enjoying our services, please renew your membership soon.\n\nContact us for renewal or any questions!\n\nThank you for being a valued member! 💪`;
        }

        const whatsappResponse = await fetch(
          `https://graph.facebook.com/v18.0/${whatsappPhoneNumberId}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${whatsappToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: phoneNumber,
              type: "text",
              text: {
                body: message,
              },
            }),
          }
        );

        if (whatsappResponse.ok) {
          // Mark as sent for bulk notifications only
          if (!isIndividualNotification) {
            await supabase.rpc("mark_notification_sent", {
              member_id: member.member_id,
            });
          }
          successCount++;
        } else {
          errorCount++;
        }
        // Delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        errorCount++;
      }
    }

    return res.status(200).set(corsHeaders).json({
      message: isIndividualNotification
        ? "Individual notification processed"
        : "Expiry notifications processed",
      total_members: expiringMembers.length,
      successful_notifications: successCount,
      failed_notifications: errorCount,
    });
  } catch (error) {
    return res.status(500).set(corsHeaders).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
