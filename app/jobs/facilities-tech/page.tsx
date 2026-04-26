import JobTable from "@/app/components/JobTable";
import StatCard from "@/app/components/StatCard";
import { getFeedSummary, getTrackBySlug, getTrackJobs } from "@/lib/jobs";

export const dynamic = "force-dynamic";

export default async function FacilitiesTechPage() {
  const track = getTrackBySlug("facilities-tech");
  const jobs = await getTrackJobs("facilities-tech");
  const summary = await getFeedSummary();

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
          detail="Current jobs tied to maintenance, engineering, field operations, and technical service language."
        />
        <StatCard
          eyebrow="Background value"
          title="Credible starting point"
          detail="This lane preserves current strengths while making the portfolio feel grounded and practical."
          tone="accent"
        />
        <StatCard
          eyebrow="Search footprint"
          title={`ZIP ${summary.zip}`}
          detail="This lane still reflects the current market filter while the tracking system is being built out."
          tone="ember"
        />
      </section>

      <JobTable jobs={jobs} track={track} />
    </div>
  );
}
