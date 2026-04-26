import JobTable from "@/app/components/JobTable";
import StatCard from "@/app/components/StatCard";
import { getFeedSummary, getTrackBySlug, getTrackJobs } from "@/lib/jobs";

export default function BiomedicalDevicePage() {
  const track = getTrackBySlug("biomedical-device");
  const jobs = getTrackJobs("biomedical-device");
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
          detail="Current jobs mapped into this career lane using lightweight title and company keyword rules."
        />
        <StatCard
          eyebrow="Feed radius"
          title={`${summary.radiusMiles} miles`}
          detail={`Phase 0 still relies on the existing ZIP ${summary.zip} job feed.`}
          tone="accent"
        />
        <StatCard
          eyebrow="Reason to build"
          title="Strong bridge"
          detail="This lane translates maintenance reliability experience into hospital equipment and device support language."
          tone="ember"
        />
      </section>

      <JobTable jobs={jobs} track={track} />
    </div>
  );
}
