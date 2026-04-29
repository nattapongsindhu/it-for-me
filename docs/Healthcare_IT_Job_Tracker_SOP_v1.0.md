# Healthcare IT Job Tracker: Project Documentation & Standard Operating Procedures

**Version:** 1.0  
**Phase:** Production Deployment  
**Project:** it-for-me  
**Prepared for:** Rogers / Codex continuation workflow  
**Last updated:** April 28, 2026  
**Production URL:** https://it-for-me.vercel.app/dashboard

## 1. Executive Summary

`it-for-me` is a practical Healthcare IT portfolio and job-tracking system designed to support a career transition from hands-on maintenance work into Biomedical Equipment Technician (BMET), Healthcare IT, IT support, and technical operations roles.

The project began as a local job-feed automation workflow and was progressively upgraded into a production-ready Next.js portfolio application. It now combines a Supabase-backed job catalog, application status tracking, dashboard analytics, a follow-up queue, client-side filtering, and a public read-only production deployment on Vercel.

The current production posture is intentionally conservative: public visitors can view the portfolio and live operational structure, while unauthenticated write operations remain disabled in production to protect database integrity.

## 2. System Architecture & Tools

| Domain | Tools / Technologies |
| --- | --- |
| Frontend | Next.js App Router, React, TypeScript, Tailwind CSS |
| UI Shell | Dark sidebar, responsive dashboard layout, mobile hamburger navigation |
| Backend / Database | Supabase PostgreSQL, Supabase JS client |
| Server Runtime | Next.js Server Components and API Routes |
| Local Write Operations | Local-only API routes using Supabase service role key |
| Production Hosting | Vercel production deployment |
| Source Control | GitHub main branch |
| Legacy Automation | Python scripts and GitHub Actions workflow dispatch |
| Legacy Snapshot Output | `LATEST_JOBS.md`, `jobs.json`, `index.html` |

## 3. Current Production State

The project is live and operational at:

https://it-for-me.vercel.app/dashboard

Production environment variables have been configured in Vercel for:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

The public production app uses Supabase for read operations. Production write operations remain blocked by design through `NODE_ENV === "production"` guards in the application API routes.

## 4. Project Phases & Implementation History

### Phase 0: Foundation & UI Shell

Objective: Convert the repository from a static job-feed project into a structured portfolio application.

Completed work:

- Established a Next.js and Tailwind CSS application shell.
- Added a dark sidebar inspired by the IT Asset Tracker visual language.
- Created main routes:
  - `/dashboard`
  - `/jobs/biomedical-device`
  - `/jobs/it-helpdesk`
  - `/jobs/facilities-tech`
- Preserved `jobs.json` as a local fallback data source.
- Kept legacy static artifacts for historical reference only.

### Phase 1: Supabase Data Foundation

Objective: Move job data from static JSON toward a structured database-backed catalog.

Completed work:

- Added Supabase utility modules:
  - `lib/supabase/env.ts`
  - `lib/supabase/client.ts`
  - `lib/supabase/server.ts`
  - `lib/supabase/admin.ts`
  - `lib/supabase/index.ts`
- Created migration draft:
  - `supabase/migrations/20260426093000_phase1_jobs_and_applications.sql`
- Created tables:
  - `public.jobs`
  - `public.applications`
- Implemented Supabase-first read path with local `jobs.json` fallback.
- Added local-only seed route:
  - `app/api/seed/route.ts`

### Phase 2: Application Tracking Operations

Objective: Add lightweight application tracking and details management.

Completed work:

- Added application status model:
  - `SAVED`
  - `APPLIED`
  - `INTERVIEWING`
  - `OFFER`
  - `REJECTED`
  - `WITHDRAWN`
- Added local-only write endpoints:
  - `app/api/applications/status/route.ts`
  - `app/api/applications/details/route.ts`
- Added status dropdowns in the job table.
- Added inline application detail editor.
- Added status filtering.
- Added dashboard summary cards.
- Preserved production write protections while allowing local development writes.

### Phase 3: Command Center & Follow-up Queue

Objective: Make the dashboard operational rather than purely informational.

Completed work:

- Added `FollowUpQueue` component.
- Added follow-up logic for applications where:
  - `follow_up_date <= today`
  - status is not `OFFER`, `REJECTED`, or `WITHDRAWN`
- Added a friendly empty state when no follow-ups are due.
- Added shared job-loading helper for dashboard-wide analytics.

### Phase 4: Production Polish & Analytics

Objective: Prepare the portfolio for recruiter-facing review and production deployment.

Completed work:

- Added `AnalyticsBrief` for high-level application metrics.
- Added `CareerLaneChart` using CSS/Tailwind bars instead of a charting library.
- Added client-side search and global status filtering through `JobFilterBar`.
- Added `JobTableSkeleton` and dashboard route loading state.
- Added mobile hamburger navigation.
- Improved sidebar active state.
- Improved job-table empty state with a clear-filters action.
- Updated README into a recruiter-facing portfolio document.
- Deployed to Vercel production.

## 5. Data Flow

### Primary Runtime Flow

1. Next.js dashboard requests portfolio job data.
2. `lib/jobs.ts` attempts to load jobs from Supabase.
3. Application rows are loaded by `job_id` using the Supabase service role client when available.
4. Jobs and application tracking metadata are merged into `TrackedJob` records.
5. Dashboard components render:
   - summary cards
   - follow-up queue
   - analytics brief
   - career lane distribution
   - featured job table

### Fallback Flow

If Supabase environment variables are unavailable or Supabase read operations fail, the application falls back to `jobs.json` so the portfolio remains viewable during setup or local development.

### Legacy Automation Flow

The legacy automation path is manual-only:

```text
GitHub Actions workflow_dispatch
  -> scripts/fetch_jobs.py
  -> jobs.json
  -> scripts/update_readme.py
  -> LATEST_JOBS.md
  -> scripts/update_dashboard.py
  -> index.html
```

`README.md` is no longer a legacy automation target. This protects the main portfolio documentation from being overwritten by job-feed snapshots.

## 6. Security & Operations Notes

### Production Read-only Guardrail

The production deployment is public-facing and intentionally blocks unauthenticated write operations. API routes that modify application data reject production writes until an authenticated workflow is added.

This protects:

- application status records
- notes
- recruiter contact fields
- follow-up dates
- Supabase service role operations

### Service Role Handling

`SUPABASE_SERVICE_ROLE_KEY` is server-only and must never use the `NEXT_PUBLIC_` prefix. It is configured in Vercel as an encrypted environment variable.

### Public Client Handling

The following variables are safe to expose to the browser by design:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Supabase row-level security and application-level route guards remain responsible for protecting write access.

## 7. Standard Operating Procedures

### 7.1 Daily Status Check

1. Open the production dashboard:
   - https://it-for-me.vercel.app/dashboard
2. Confirm the dashboard loads successfully.
3. Review:
   - tracked applications
   - follow-up queue
   - analytics brief
   - career lane distribution
4. Confirm no unexpected production write behavior is exposed.

### 7.2 Updating Legacy Job Data

Use this only when a fresh job snapshot is needed.

1. Open GitHub repository Actions.
2. Select `IT For Me Legacy Job Scanner`.
3. Run the workflow manually.
4. Confirm the workflow completes successfully.
5. Verify that the workflow updates:
   - `jobs.json`
   - `LATEST_JOBS.md`
   - `index.html`
6. Confirm `README.md` remains unchanged.

### 7.3 Syncing Local Machine After Workflow Runs

```bash
git pull origin main
npm run build
```

If the production dashboard should receive the new snapshot immediately:

```bash
vercel --prod --yes
```

### 7.4 Local Development

```bash
npm install
npm run dev
```

Local URL:

```text
http://localhost:3001
```

Required `.env.local` values:

```text
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### 7.5 Local Application Tracking Test

1. Start the dev server.
2. Open a job lane or dashboard job table.
3. Change a status such as `SAVED` or `APPLIED`.
4. Save details such as follow-up date or notes.
5. Refresh the dashboard.
6. Confirm summary cards, follow-up queue, and job table state reflect the change.

Do not use this flow in production until authentication and authorization are added.

## 8. Deployment Procedure

### Production Deploy

```bash
npm run build
vercel --prod --yes
vercel inspect it-for-me.vercel.app
```

Expected result:

- build succeeds
- Vercel deployment status is `Ready`
- alias points to `https://it-for-me.vercel.app`

### GitHub Push

```bash
git status
git add .
git commit -m "descriptive message"
git push origin main
```

If push is rejected because remote `main` moved:

```bash
git fetch origin
git rebase origin/main
npm run build
git push origin main
```

Resolve README conflicts by preserving the portfolio README, not the generated job-feed snapshot.

## 9. Future Roadmap

### AI Resume Tailoring

Potential enhancement: parse selected job descriptions and generate role-specific resume bullets tailored to Healthcare IT, BMET, or technical support roles.

### Interview Preparation Module

Potential enhancement: store interview notes, expected questions, role context, and follow-up templates per application.

### Notification System

Potential enhancement: notify when high-priority jobs appear, follow-up dates become due, or interview status changes.

Possible channels:

- email
- LINE
- dashboard notification badge

### Authenticated Production Operations

Potential enhancement: add authentication so the owner can safely update application statuses in production while public viewers remain read-only.

Recommended approach:

- Supabase Auth or another trusted auth provider
- route-level authorization
- explicit admin-only write paths
- audit logging for status and detail changes

### Supabase Automation Pipeline

Potential enhancement: have the legacy fetch pipeline write directly into `public.jobs` instead of relying on `jobs.json` and manual seeding.

## 10. Known Constraints

- Production write operations are intentionally disabled.
- Legacy GitHub Actions workflow is manual-only.
- `LATEST_JOBS.md` is a legacy snapshot and should not be treated as the primary production source.
- `README.md` is the primary recruiter-facing portfolio document and must not be generated by automation.
- The dashboard prioritizes clarity and portfolio value over heavy analytics or complex BI.

## 11. Completion Criteria

The system is considered operational when:

- production deployment is `Ready` on Vercel
- dashboard loads successfully
- Supabase read path works or local fallback displays correctly
- README remains stable after workflow runs
- `LATEST_JOBS.md` receives generated job snapshots
- local build passes with `npm run build`

---

This document is intended to preserve project context, reduce onboarding time, and provide a stable operating guide for future development of `it-for-me`.
