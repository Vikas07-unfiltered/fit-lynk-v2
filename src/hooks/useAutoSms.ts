import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSmsNotifications } from '@/hooks/useSmsNotifications';

export const useAutoSms = () => {
  const { gym } = useAuth();
  const { sendWelcomeSms } = useSmsNotifications();

  useEffect(() => {
    if (!gym?.id) return;

    console.log('Setting up SMS auto-notifications for gym:', gym.id);

    // Set up real-time subscription for new members
    const memberSubscription = supabase
      .channel('member-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'members',
          filter: `gym_id=eq.${gym.id}`
        },
        async (payload) => {
          console.log('New member added:', payload.new);
          
          // Send welcome SMS automatically
          if (payload.new && payload.new.id) {
            try {
              // Add a small delay to ensure the member is fully created
              setTimeout(async () => {
                await sendWelcomeSms(payload.new.id);
                console.log('Welcome SMS sent for new member:', payload.new.name);
              }, 2000);
            } catch (error) {
              console.error('Failed to send welcome SMS:', error);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Member subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up SMS subscriptions');
      supabase.removeChannel(memberSubscription);
    };
  }, [gym?.id, sendWelcomeSms]);

  // Set up daily check for expiring memberships
  useEffect(() => {
    if (!gym?.id) return;

    const checkExpiringMemberships = async () => {
      try {
        // This would typically be handled by a cron job or scheduled function
        // For now, we'll check when the component mounts
        const { data: expiringMembers } = await supabase.rpc('get_expiring_members', {
          days_before: 5
        });

        if (expiringMembers && expiringMembers.length > 0) {
          console.log(`Found ${expiringMembers.length} members with expiring memberships`);
          // The actual SMS sending would be handled by a scheduled function
        }
      } catch (error) {
        console.error('Error checking expiring memberships:', error);
      }
    };

    // Check immediately and then set up interval (optional - mainly for demo)
    checkExpiringMemberships();
    
    // Check every hour (in production, this would be a server-side cron job)
    const interval = setInterval(checkExpiringMemberships, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [gym?.id]);
};