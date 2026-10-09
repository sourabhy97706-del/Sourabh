import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function esc(value: unknown): string {
  return String(value ?? "").replace(/[&<>"]/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;",
  }[c] ?? c));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const expected = Deno.env.get("CRON_SECRET");
  const auth = req.headers.get("authorization") ?? "";
  if (!expected || auth !== `Bearer ${expected}`) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL");
  if (!supabaseUrl || !serviceKey || !resendKey || !fromEmail) {
    return new Response("Missing server configuration", { status: 500, headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: rows, error } = await supabase
    .from("user_tracker_data")
    .select("user_id,data,active_day,total_habits,report_email")
    .eq("auto_report_enabled", true);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sent: string[] = [];
  const failures: { email: string; error: string }[] = [];
  for (const row of rows ?? []) {
    const email = String(row.report_email || "sourabhy97706@gmail.com").trim();
    const dayNum = Math.min(30, Math.max(1, Number(row.active_day) || 1));
    const day = row.data?.[String(dayNum)] ?? {};
    const checks = day.checks ?? {};
    const habits = Object.entries(checks).filter(([, value]) => value === true).map(([name]) => name);
    const water = ((day.waterPoints?.length ?? 0) * 0.25).toFixed(2);
    const subject = `Sourabh Daily Routine — Day ${dayNum} report`;
    const habitList = habits.length
      ? `<ul>${habits.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>`
      : "<p>No habits were checked off for this selected day yet.</p>";
    const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#203128;line-height:1.5">
      <h1>Sourabh Daily Routine</h1><h2>Day ${dayNum} report</h2>
      <p><b>Habit score:</b> ${habits.length}/${Number(row.total_habits) || 11}</p>
      <p><b>Water:</b> ${water} L</p><p><b>Sleep:</b> ${esc(day.sleep || "—")} hours</p>
      <p><b>Gym:</b> ${esc(day.gym || "—")}</p><p><b>Skin:</b> ${esc(day.skin || "—")}</p>
      <p><b>Notes:</b> ${esc(day.notes || "—")}</p><h3>Completed habits</h3>${habitList}
      <p style="color:#66756c">This report was generated from your Sourabh Daily Routine tracker.</p>
      </body></html>`;

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: fromEmail, to: [email], subject, html }),
      });
      if (!response.ok) {
        failures.push({ email, error: (await response.text()).slice(0, 500) });
      } else sent.push(email);
    } catch (e) {
      failures.push({ email, error: String(e) });
    }
  }

  return new Response(JSON.stringify({ sent: sent.length, failures, timestamp: new Date().toISOString() }), {
    status: failures.length ? 207 : 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
