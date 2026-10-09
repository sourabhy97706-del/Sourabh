# Sourabh Daily Routine

A responsive 30-day habit tracker with local save, undo, JSON backup/restore, CSV export, email/password authentication, optional cloud sync, and an opt-in daily email report.

## 1. Publish the site through Vercel
The GitHub repository is https://github.com/sourabhy97706-del/Sourabh.
1. In Vercel, import the `sourabhy97706-del/Sourabh` GitHub repository, or open the existing `sourabh-daily-routine` project and connect it to this repository.
2. Framework preset: Other. Root directory: repository root. No build command is required for this static HTML site.
3. Trigger a production deployment from the `main` branch.
4. In Vercel project settings, check Deployment Protection. Disable SSO protection for Production if you want the site publicly accessible. Keep preview deployments protected if preferred.
5. Add a custom domain under Project → Settings → Domains. Follow the DNS records Vercel provides at your domain registrar. You need to own/register the domain separately.

## 2. Configure Supabase login and cross-device sync
1. Create a project at https://supabase.com/dashboard.
2. In Supabase SQL Editor, run the complete contents of `supabase/schema.sql`.
3. Open `config.js` in GitHub and replace `YOUR_SUPABASE_PROJECT_URL` and `YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY` with your project's URL and browser-safe publishable key (legacy anon key is also accepted). Commit the change to `main`; Vercel should redeploy automatically.
4. In Supabase → Authentication → URL Configuration, set Site URL to your final Vercel/custom-domain URL and add that URL to the allowed redirect URLs.
5. Open the deployed site and create your account. Email confirmation may be required depending on Supabase Auth settings.
6. Cloud sync uses Row Level Security. Each authenticated user can access only their own tracker row.

Do not put Supabase's `service_role` key in `config.js`, HTML, or any browser code.

## 3. Enable daily email report (optional, server-side)
The email UI records the opt-in preference in the tracker. Actual automatic delivery requires the function and email provider setup below.
1. Create/verify a sender domain in https://resend.com and obtain an API key.
2. Install Supabase CLI and log in. From this repository root, deploy the function:
   `supabase functions deploy daily-report --no-verify-jwt`
   The function independently checks a `CRON_SECRET` bearer token. Supabase's `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are available to Edge Functions by default.
3. Set server secrets (never commit them):
   `supabase secrets set CRON_SECRET="a-long-random-secret" RESEND_API_KEY="re_..." RESEND_FROM_EMAIL="Sourabh Routine <reports@your-verified-domain.com>"`
4. In Supabase SQL Editor, enable `pg_cron` and `pg_net` extensions. Store the function URL and the same secret in Supabase Vault, then schedule the POST call at 03:30 UTC (09:00 India time). Example after saving Vault secrets named `daily_report_url` and `daily_report_cron_secret`:
   ```sql
   select cron.schedule(
     'sourabh-daily-routine-email',
     '30 3 * * *',
     $$
     select net.http_post(
       url := (select decrypted_secret from vault.decrypted_secrets where name = 'daily_report_url'),
       headers := jsonb_build_object(
         'Content-Type', 'application/json',
         'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'daily_report_cron_secret')
       ),
       body := '{}'::jsonb
     );
     $$
   );
   ```
   The function sends only to users who explicitly enabled the daily report. The report reflects each user's selected tracker day. Test once manually before relying on the schedule.
5. The browser's “Prepare email draft now” button is a manual fallback; it opens your email app and does not send automatically.

## Data and backup
- Local mode stores tracker data in this browser.
- Signed-in mode saves one record per user to Supabase.
- Use Download JSON backup before restoring or changing accounts.
- CSV includes all 30 days, habits, water, sleep, gym, skin, and notes.
