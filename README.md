# Sourabh Daily Routine

A mobile-friendly 30-day habit tracker with local saving, undo, JSON backup/restore, CSV export, email draft, and optional Supabase authentication/cloud sync.

## Publish on Vercel
1. In Vercel, import this GitHub repository: https://github.com/sourabhy97706-del/Sourabh
2. Use the repository root as the root directory. This is a static HTML site; no build command is needed.
3. Before cloud login/sync can work, create a Supabase project and run `supabase/schema.sql` in its SQL Editor.
4. Edit `config.js` with the Supabase project URL and publishable/anon key. These are browser keys; never put a service-role key in this file.
5. In Supabase Auth settings, set the site URL and allowed redirect URLs to your deployed Vercel URL.
6. Deploy/redeploy.

## Features
- 30 days of habit checklists and notes
- Local browser persistence when Supabase is not configured
- Email/password sign-up and sign-in via Supabase
- Per-user cloud sync using Row Level Security
- Undo last checklist change
- JSON backup/restore and CSV export
- Opens a pre-filled daily email draft

## Automatic daily email
Automatic scheduled email is not enabled in this minimal deployment. It requires a server-side scheduled function and an email provider (for example, Resend), plus secure secrets and a scheduled trigger. Do not store email provider secrets in browser code.
