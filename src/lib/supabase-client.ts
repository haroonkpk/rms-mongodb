"use client";

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://jxmorzaxtmppkfldvqrg.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4bW9yemF4dG1wcGtmbGR2cXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAxNTAwMDAwMH0.placeholder";

declare global {
  interface Window {
    __supabaseKDSClient?: SupabaseClient;
  }
}

/**
 * Returns a strict singleton browser instance of Supabase Client for Realtime subscriptions
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (typeof window === "undefined") return null;

  if (!window.__supabaseKDSClient) {
    try {
      window.__supabaseKDSClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });
    } catch (error) {
      console.warn("Supabase Realtime client initialization failed:", error);
      return null;
    }
  }

  return window.__supabaseKDSClient;
}
