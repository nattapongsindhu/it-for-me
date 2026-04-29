import { type PortfolioTrack, type TrackedJob } from "@/lib/jobs";

type CareerLaneChartProps = {
  jobs: TrackedJob[];
};

type TrackConfig = {
  label: string;
  slug: PortfolioTrack;
};

const TRACKS: TrackConfig[] = [
  { label: "Biomedical & Device", slug: "biomedical-device" },
  { label: "IT & Helpdesk", slug: "it-helpdesk" },
  { label: "Facilities & Tech", slug: "facilities-tech" },
];

function getTrackStats(jobs: TrackedJob[]) {
  return TRACKS.map((track) => {
    const trackJobs = jobs.filter((job) => job.track === track.slug);
    const active = trackJobs.filter(
      (job) => job.applicationStatus === "APPLIED" || job.applicationStatus === "INTERVIEWING"
    ).length;

    return {
      active,
      label: track.label,
      percentage: jobs.length > 0 ? Math.round((trackJobs.length / jobs.length) * 100) : 0,
      total: trackJobs.length,
    };
  });
}

export default function CareerLaneChart({ jobs }: CareerLaneChartProps) {
  const trackStats = getTrackStats(jobs);

  return (
    <section className="rounded-panel border border-slate-800 bg-slate-950 p-6 shadow-card md:p-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-400">
            Career lane distribution
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
            Opportunity distribution by track
          </h2>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          {jobs.length} total opportunities
        </p>
      </div>

      <div className="mt-7 space-y-6">
        {trackStats.map((track) => (
          <div key={track.label}>
            <div className="mb-2 flex items-center justify-between gap-4 text-xs">
              <span className="font-semibold uppercase tracking-[0.2em] text-slate-200">
                {track.label}
              </span>
              <span className="text-slate-400">
                {track.total} jobs ({track.active} active)
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 shadow-[0_0_10px_rgba(37,99,235,0.4)] transition-all duration-1000"
                style={{ width: `${track.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-7 flex flex-col gap-3 border-t border-slate-800 pt-4 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-slate-500 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-600" />
          Volume
        </div>
        <p>Reflects career transition focus area</p>
      </div>
    </section>
  );
}
