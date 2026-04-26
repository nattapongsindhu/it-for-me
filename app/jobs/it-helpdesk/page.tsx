import JobTable from "@/app/components/JobTable";
import StatCard from "@/app/components/StatCard";
import { getFeedSummary, getTrackBySlug, getTrackJobs } from "@/lib/jobs";

export default function ItHelpdeskPage() {
  const track = getTrackBySlug("it-helpdesk");
  const jobs = getTrackJobs("it-helpdesk");
  const summary = getFeedSummary();

  return (
    <div className="space-y-6">
      <section className="rounded-panel border border-line bg-white p-6 shadow-card md:p-8">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-500">
          Career lane
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink md:text-5xl">
          {track.name}
        </h1>
        <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600 md:text-base">
          {track.description}
        </p>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600 md:text-base">
          {track.focus}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          eyebrow="Matched jobs"
          title={`${jobs.length}`}
          detail="Current jobs mapped into this lane using simple case-insensitive keyword grouping."
        />
        <StatCard
          eyebrow="Primary market"
          title="Healthcare IT entry"
          detail="This lane supports the move into support operations, device-adjacent IT, and helpdesk-style problem solving."
          tone="accent"
        />
        <StatCard
          eyebrow="Source state"
          title={`${summary.count} raw jobs`}
          detail="The local job feed is intentionally reused in Phase 0 to keep the system understandable."
          tone="ember"
        />
      </section>

      <JobTable jobs={jobs} track={track} />
    </div>
  );
}
