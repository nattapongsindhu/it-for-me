# it-for-me: Healthcare IT Portfolio & Tracker

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/Automated_Scraper-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

A practical portfolio shell and application tracking system built to support a career transition from hands-on maintenance work into Healthcare IT, Biomedical Equipment Technician (BMET), facilities technology, and technical support roles.

[Live Production Dashboard](https://it-for-me.vercel.app/dashboard)

## Project Mission

This project is more than a resume. It is a functional workflow tool that helps discover, organize, and track job opportunities across nearby technical career lanes.

The current production system tracks:

1. **Biomedical & Device:** Hospital equipment, clinical engineering, medical device, and healthcare-adjacent technical roles.
2. **IT & Helpdesk:** IT support, endpoint operations, systems support, and healthcare IT roles.
3. **Facilities & Tech:** Maintenance, engineering, field operations, and technician pathways.
4. **Hospital Careers:** Direct hospital career feeds from Greater Los Angeles medical networks.

## Architecture & Tech Stack

- **Frontend:** Next.js App Router, TypeScript, Tailwind CSS
- **Backend & Database:** Supabase PostgreSQL and Next.js server routes
- **Automation Pipeline:** Python scrapers orchestrated by GitHub Actions
- **Deployment:** Vercel production deployment

## Key Features

- **Multi-source job pipeline:** USAJobs plus direct hospital career feeds for Kaiser Permanente, Huntington Health, Cedars-Sinai, Dignity Health / Glendale Memorial, and other monitored Greater LA hospital sources.
- **Twice-daily automation:** GitHub Actions runs scheduled scans at 06:00 and 18:00 Los Angeles time during PDT.
- **Hospital Careers lane:** Dedicated page for direct medical-network opportunities.
- **Salary normalization:** Job salary display is normalized into hourly and annual views using the 2,080-hour work-year standard.
- **Application tracking:** Local development write routes support status changes, application details, follow-up dates, and notes.
- **Analytics dashboard:** Visual summaries show application activity, interview rate, follow-up queue, and career-lane distribution.
- **Search and filtering:** Client-side search and status filters keep job review fast for small portfolio-sized datasets.

## Security & Operations Note

The production deployment currently operates in a read-only mode for public viewers. Unauthenticated write operations are intentionally blocked in production to protect database integrity while allowing recruiters to review the system structure. Full write access remains restricted to local development until an authenticated production flow is added.

## Local Development

```bash
# 1. Clone the repository
git clone https://github.com/nattapongsindhu/it-for-me.git

# 2. Install dependencies
npm install

# 3. Set up environment variables in .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# 4. Start the development server
npm run dev
```

## Automation

The scheduled GitHub Actions workflow runs the local job scanner and hospital job scanner together:

```bash
python3 scripts/fetch_jobs.py
python3 scripts/fetch_hospital_jobs.py
python3 scripts/update_readme.py
python3 scripts/update_dashboard.py
```

Generated job snapshots are committed back to the repository:

- `jobs.json`
- `hospital_jobs.json`
- `LATEST_JOBS.md`
- `index.html`
