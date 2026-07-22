// ============================================================
// Supabase Edge Function: admin-actions
// ------------------------------------------------------------
// Lets the Master Admin (and ONLY the master admin) do things the
// public browser app is not allowed to do:
//   • reset_password  — set a new password for any student
//   • delete_user     — permanently delete a student account
//
// It runs on Supabase's servers using the SERVICE ROLE key, which is
// auto-injected as an env var and is NEVER exposed to the browser.
// The caller's JWT is checked so only admin@arduino-academy.local passes.
//
// Deploy: Supabase Dashboard -> Edge Functions -> create "admin-actions"
// -> paste this file -> Deploy. (Service role key is provided automatically.)
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ADMIN_EMAIL = "admin@arduino-academy.local";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Always answer 200 with a small JSON body so the browser can read {ok}/{error}
// without wrestling with HTTP error objects.
function reply(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    // --- Authorize the caller from their JWT ---
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (!token) return reply({ error: "You are not signed in." });
    const { data: who, error: whoErr } = await admin.auth.getUser(token);
    if (whoErr || !who?.user) return reply({ error: "Your session expired — log in again." });
    if (who.user.email !== ADMIN_EMAIL) return reply({ error: "Only the Master Admin can do this." });

    const { action, user_id, new_password } = await req.json();

    if (action === "reset_password") {
      if (!user_id || !new_password || String(new_password).length < 6) {
        return reply({ error: "Password must be at least 6 characters." });
      }
      const { error } = await admin.auth.admin.updateUserById(user_id, { password: String(new_password) });
      if (error) return reply({ error: error.message });
      // Keep the admin's credential book in sync so the new password shows up.
      await admin.from("student_credentials").upsert({
        user_id,
        password: String(new_password),
        updated_at: new Date().toISOString(),
      });
      return reply({ ok: true });
    }

    if (action === "delete_user") {
      if (!user_id) return reply({ error: "Missing user." });
      if (user_id === who.user.id) return reply({ error: "You can't delete your own admin account here." });
      const { error } = await admin.auth.admin.deleteUser(user_id);
      if (error) return reply({ error: error.message });
      return reply({ ok: true });
    }

    return reply({ error: "Unknown action." });
  } catch (e) {
    return reply({ error: String((e as Error)?.message || e) });
  }
});
