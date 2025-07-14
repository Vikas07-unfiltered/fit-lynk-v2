import { createClient, PostgrestError } from '@supabase/supabase-js';
import { Member } from '../types/member';

// TODO: Prefer using env variables (e.g. import.meta.env) in production.
// Falling back to inline keys because the existing codebase follows this pattern.
const supabaseUrl = 'https://ahuwcoocemayyphdrmjz.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFodXdjb29jZW1heXlwaGRybWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDQ4NzIsImV4cCI6MjA2NjI4MDg3Mn0.vE-fSJMD91TZicpK6eLyHZi7tprfh4hVi_wjRolj_2w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type for the update response
interface UpdateResponse {
  error: PostgrestError | null;
  data: Member[] | null;
}

/**
 * Process a membership payment and extend the member's expiry date.
 *
 * @param memberId The primary key (id) of the member in the `members` table.
 * @param paymentAmount The amount paid by the member (in the same currency as `plan_amount_per_month`).
 */
export interface ProcessPaymentOptions {
  gymId: string;
  memberId: string;
  amount: number;
  method: string; // e.g. 'cash', 'upi', 'card'
  planName?: string; // optional override if member.plan not suitable
}

/**
 * Extends membership expiry and records a payment.
 */
export async function processMembershipPayment(opts: ProcessPaymentOptions) {
  try {
    // 1. Fetch current membership details
    // Build base member query
    let memberQuery = supabase
      .from('members')
      .select('id, user_id, name, plan, plan_expiry_date, status, gym_id');

    if (opts.gymId) {
      memberQuery = memberQuery.eq('gym_id', opts.gymId);
    }
    let effectiveGymId: string | undefined;
    const isUuid = /^[0-9a-fA-F-]{36}$/.test(opts.memberId);
    if (isUuid) {
      memberQuery = memberQuery.eq('id', opts.memberId);
    } else {
      memberQuery = memberQuery.eq('user_id', opts.memberId);
    }

    const { data: member, error: fetchError } = await memberQuery.single();

    if (fetchError || !member) {
      throw new Error(`Member not found for id ${opts.memberId}`);
    }
    // Replace empty gymId with member.gym_id
    if (!opts.gymId && (member as any).gym_id) {
      effectiveGymId = (member as any).gym_id;
    } else {
      effectiveGymId = opts.gymId;
    }
    // Log after effectiveGymId is set
    console.log('[processMembershipPayment] Update params:', {
      gym_id: effectiveGymId,
      id: isUuid ? opts.memberId : undefined,
      user_id: !isUuid ? opts.memberId : undefined,
      isUuid
    });

    // 1a. Look up the plan price & duration
    let planQuery = supabase
      .from('membership_plans')
      .select('price, duration_months')
      .eq('name', (member as any).plan);
    if (effectiveGymId) {
      planQuery = planQuery.eq('gym_id', effectiveGymId);
    }
    const { data: planRow, error: planErr } = await planQuery.single();

    if (planErr || !planRow) {
      throw new Error(`No pricing info found for plan "${member.plan}"`);
    }

    const pricePerMonth = Number(planRow.price) / Number(planRow.duration_months || 1);

    // Member's current expiry date (may be null)
    const currentExpiry: string | null = (member as any).plan_expiry_date;

    // 2. Calculate how many full months were paid for
    const monthsPaid = Math.floor(opts.amount / pricePerMonth);

    if (monthsPaid <= 0) {
      throw new Error('Payment amount is less than one month of membership.');
    }

    // 3. Determine the base date from which to extend
    const today = new Date();
    let baseDate: Date;

    if (!currentExpiry) {
      baseDate = today;
    } else {
      const exp = new Date(currentExpiry);
      baseDate = exp < today ? today : exp;
    }

    // 4. Extend expiry by the number of months paid
    const newExpiry = new Date(baseDate);
    newExpiry.setMonth(newExpiry.getMonth() + monthsPaid);
    
    // Log detailed information about the update
    console.log('[processMembershipPayment] Update details:', {
      memberId: opts.memberId,
      isUuid,
      currentExpiry: currentExpiry,
      baseDate: baseDate.toISOString(),
      monthsPaid,
      newExpiry: newExpiry.toISOString(),
      effectiveGymId
    });

    // 5. Update the member record with explicit typing
    const updateData = {
      status: 'active',
      plan_expiry_date: newExpiry.toISOString().split('T')[0],
      last_payment: today.toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    } as const;

    // Build the query with filters first
    let updateQuery = supabase
      .from('members')
      .update(updateData)
      .eq('gym_id', effectiveGymId || member.gym_id || '')
      .eq(isUuid ? 'id' : 'user_id', opts.memberId);

    // Log the complete query details
    console.log('[processMembershipPayment] Update query details:', {
      updateData,
      filters: {
        gymId: effectiveGymId || member.gym_id,
        memberId: opts.memberId,
        isUuid
      }
    });

    // Execute update with proper typing
    const updateResult = await updateQuery as UpdateResponse;
    
    if (updateResult.error) {
      console.error('[processMembershipPayment] Update failed:', updateResult.error);
      throw updateResult.error;
    }

    if (!updateResult.data) {
      throw new Error(`No data returned from update for member ${opts.memberId}`);
    }

    // Log update result
    console.log('[processMembershipPayment] Update result:', {
      success: true,
      affectedRows: updateResult.data.length,
      newExpiryDate: newExpiry.toISOString().split('T')[0]
    });

    if (updateResult.data.length === 0) {
      throw new Error(`No rows were updated for member ${opts.memberId}`);
    }

    // 6. Record payment in payments table
    const paymentRow: Record<string, any> = {
      member_id: (member as any).id,
      amount: opts.amount,
      payment_date: today.toISOString().split('T')[0],
      payment_method: opts.method,
      plan_name: opts.planName ?? (member as any).plan,
      status: 'completed',
      member_name: (member as any).name,
      member_user_id: (member as any).user_id ?? opts.memberId,
    };
    if (effectiveGymId) paymentRow.gym_id = effectiveGymId;

    const { error: payErr } = await supabase.from('payments').insert([paymentRow]);

    if (payErr) throw payErr;

    return {
      success: true,
      message: `Membership extended to ${newExpiry.toDateString()}`,
      newExpiry: newExpiry.toISOString().split('T')[0],
    };
  } catch (err: any) {
    // Log the error for debugging
    console.error('processMembershipPayment error:', err);
    return {
      success: false,
      message: err.message || 'Unknown error occurred',
    };
  }
}
