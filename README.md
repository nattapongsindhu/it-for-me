# 🏥 it-for-me: IT Portfolio & Tracker

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/Automated_Scraper-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

A practical portfolio shell and application tracking system built to support a career transition from hands-on Maintenance Mechanics into **Healthcare IT, Biomedical Equipment Technician (BMET), and Technical Support** roles.

🔗 **[Live Production Dashboard](https://it-for-me.vercel.app/dashboard)**

## 🎯 Project Mission

This project is more than a resume; it is a functional workflow tool. It automates job discovery (focusing on a 5-mile radius around ZIP 90029) and provides a secure, organized command center to track applications, schedule follow-ups, and visualize career progression across three specific lanes:

1. **Biomedical & Device:** Hospital equipment, clinical engineering, and device roles.
2. **IT & Helpdesk:** IT support, endpoint operations, and systems work.
3. **Facilities & Tech:** Maintenance and field operations pathways.

## 🏗️ Architecture & Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **Backend & Database:** Supabase (PostgreSQL)
- **Automation Pipeline:** Python scripts orchestrated via GitHub Actions (Auto-updated twice daily via USAJobs/Google Jobs APIs)
- **Deployment:** Vercel (Frontend CI/CD)

## ✨ Key Features

- **Automated Data Pipeline:** GitHub Actions fetches the latest local jobs and continuously updates the Supabase catalog.
- **Real-time Analytics:** Visual dashboard showing opportunity distribution, application volume, and interview success rates.
- **Follow-up Command Center:** Built-in queue system to track pending actions and interview dates.
- **Instant Search & Filter:** Client-side data processing for fast, zero-latency job filtering.

## 🔒 Security & Operations Note

The production deployment currently operates in a "Read-Only" mode for public viewers. Unauthenticated write operations (`upsert` via Service Role) are intentionally blocked (`NODE_ENV === 'production'`) to protect database integrity while allowing recruiters to view the system's structure. Full write-access is restricted to local development environments.

## 🚀 Local Development

```bash
# 1. Clone the repository
git clone https://github.com/nattapongsindhu/it-for-me.git

# 2. Install dependencies
npm install

# 3. Setup Environment Variables (.env.local)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# 4. Start the development server
npm run dev
```
