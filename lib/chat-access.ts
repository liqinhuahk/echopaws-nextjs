import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { findSubscriptionByUserId } from "@/lib/subscriptions";

export const FREE_DAILY_CHAT_LIMIT = 10;
const ACTIVE_VIP_STATUSES = new Set(["active", "trialing", "past_due"]);

export function isVipActive(subscription: { plan?: string | null; status?: string | null } | null | undefined) {
  return subscription?.plan === "vip" && ACTIVE_VIP_STATUSES.has(subscription.status ?? "");
}

function todayUtcDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function getTodayUsage(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("usage_logs")
    .select("message_count, usage_date")
    .eq("user_id", userId)
    .eq("usage_date", todayUtcDate())
    .maybeSingle();

  if (error) {
    throw error;
  }

  return {
    used: data?.message_count ?? 0,
    usageDate: data?.usage_date ?? todayUtcDate(),
  };
}

export async function getChatAccessState(userId: string) {
  const [subscription, usage] = await Promise.all([findSubscriptionByUserId(userId), getTodayUsage(userId)]);
  const vip = isVipActive(subscription);
  const limit = vip ? null : FREE_DAILY_CHAT_LIMIT;
  const remaining = vip ? null : Math.max(FREE_DAILY_CHAT_LIMIT - usage.used, 0);

  return {
    subscription,
    vip,
    limit,
    used: usage.used,
    remaining,
  };
}

export async function consumeFreeChatQuota(userId: string, limit = FREE_DAILY_CHAT_LIMIT) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("consume_free_chat_quota", {
    p_user_id: userId,
    p_limit: limit,
  });

  if (error) {
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : null;

  return {
    allowed: Boolean(row?.allowed),
    used: Number(row?.used ?? 0),
    remaining: Number(row?.remaining ?? 0),
    limit: Number(row?.limit_count ?? limit),
  };
}
