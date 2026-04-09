import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

/**
 * Get the Supabase admin client for server-side operations.
 * Uses service role key for full access, or falls back to anon key.
 */
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error("Supabase environment variables not configured");
    }

    _supabase = createClient(url, key);
  }
  return _supabase;
}

// --- Campaign operations ---

export interface Campaign {
  id?: string;
  user_id: string;
  name: string;
  status: string;
  platform: string;
  budget?: number;
  created_at?: string;
  updated_at?: string;
}

export async function getCampaigns(userId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getCampaignById(id: string, userId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return data;
}

export async function createCampaign(campaign: Omit<Campaign, "id" | "created_at" | "updated_at">) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("campaigns")
    .insert(campaign)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCampaign(id: string, userId: string, updates: Partial<Campaign>) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("campaigns")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCampaign(id: string, userId: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("campaigns")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}

// --- Creative operations ---

export interface Creative {
  id?: string;
  user_id: string;
  campaign_id?: string;
  content: string;
  platform: string;
  image_url?: string;
  created_at?: string;
}

export async function getCreatives(userId: string, campaignId?: string) {
  const supabase = getSupabase();
  let query = supabase
    .from("creatives")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (campaignId) {
    query = query.eq("campaign_id", campaignId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createCreative(creative: Omit<Creative, "id" | "created_at">) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("creatives")
    .insert(creative)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// --- Analytics operations ---

export interface AnalyticsEvent {
  id?: string;
  user_id: string;
  campaign_id?: string;
  event_type: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

export async function logAnalyticsEvent(event: Omit<AnalyticsEvent, "id" | "created_at">) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("analytics_events")
    .insert(event)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getAnalyticsEvents(userId: string, campaignId?: string) {
  const supabase = getSupabase();
  let query = supabase
    .from("analytics_events")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (campaignId) {
    query = query.eq("campaign_id", campaignId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}
