import Link from "next/link";
import JobTable from "@/app/components/JobTable";
import StatCard from "@/app/components/StatCard";
import {
  getApplicationSummary,
  getFeedSummary,
  getLatestPriorityJobs,
  getRoadmap,
  getTrackBySlug,
  getTrackJobs,
  getTracks,
} from "@/lib/jobs";

function formatUpdated(value: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const applicationSummary = await getApplicationSummary();
  const summary = await getFeedSummary();
  const tracks = await Promise.all(
    getTracks().map(async (track) => ({
      ...track,
      count: (await getTrackJobs(track.slug)).length,
    }))
  );
  const roadmap = getRoadmap();
  const featuredTrack = getTrackBySlug("it-helpdesk");
  const featuredJobs = await getLatestPriorityJobs(8);

  return (
    <div className="space-y-6">
      <section className="rounded-panel border border-line bg-white p-6 shadow-card md:p-8">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-500">
          Phase 2 operations
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink md:text-5xl">
          Track real applications without losing the clean portfolio structure.
        </h1>
        <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600 md:text-base">
          The portfolio foundation is complete, the Supabase job catalog is live, and the next
          layer now focuses on practical application tracking. The goal remains the same: keep the
          system clean, professional, and easy to extend without overwhelming a beginner.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          eyebrow="Live feed"
          title={`${summary.count}`}
          detail="Jobs currently available from Supabase when available, with a local feed fallback during setup."
        />
        <StatCard
          eyebrow="Primary radius"
          title={`${summary.radiusMiles} miles`}
          detail={`Current search radius centered on ZIP ${summary.zip}.`}
          tone="accent"
        />
        <StatCard
          eyebrow="Tracks"
          title={`${tracks.length}`}
          detail="Career lanes built into the sidebar for practical portfolio storytelling."
        />
        <StatCard
          eyebrow="Updated"
          title={formatUpdated(summary.updated)}
          detail="Latest available job-catalog timestamp."
          tone="ember"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          eyebrow="Tracked applications"
          title={`${applicationSummary.tracked}`}
          detail="Jobs that already have an application record in the tracking table."
        />
        <StatCard
          eyebrow="Saved or shortlisted"
          title={`${applicationSummary.saved}`}
          detail="Roles worth keeping on the radar before submitting a formal application."
          tone="accent"
        />
        <StatCard
          eyebrow="Applied"
          title={`${applicationSummary.applied}`}
          detail="Applications that have already been submitted and are awaiting movement."
        />
        <StatCard
          eyebrow="Interviewing"
          title={`${applicationSummary.interviewing}`}
          detail="Active conversations where interview planning and follow-up matter most."
          tone="ember"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_minmax(0,0.95fr)]">
        <article className="rounded-panel border border-line bg-white p-6 shadow-card md:p-8">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-500">
            Work tracks
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
            Three practical career lanes
          </h2>
          <div className="mt-6 grid gap-4">
            {tracks.map((track) => (
              <Link
                key={track.slug}
                href={`/jobs/${track.slug}`}
                className="rounded-[1.5rem] border border-line bg-slate-50 p-5 transition hover:border-slate-900 hover:bg-white"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-ink">{track.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {track.description}
                    </p>
                  </div>
                  <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                    {track.count}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </article>

        <article className="rounded-panel border border-line bg-white p-6 shadow-card md:p-8">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-500">
            Phase roadmap
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
            Delivery plan with clear scope control
          </h2>
          <div className="mt-6 space-y-4">
            {roadmap.map((phase) => (
              <div
                key={phase.phase}
                className="rounded-[1.5rem] border border-line bg-slate-50 p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                    {phase.phase}
                  </p>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
                    {phase.estimate}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-ink">{phase.title}</h3>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                  {phase.items.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-panel border border-line bg-white p-6 shadow-card md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-500">
              Featured direction
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
              {featuredTrack.name} is a strong entry bridge
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {featuredTrack.focus}
            </p>
          </div>
          <Link
            href="/jobs/it-helpdesk"
            className="inline-flex rounded-full border border-slate-300 px-5 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
          >
            Open this lane
          </Link>
        </div>
      </section>

      <JobTable jobs={featuredJobs} track={featuredTrack} />
    </div>
  );
}
