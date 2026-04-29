import { type PortfolioTrackMeta, type TrackedJob } from "@/lib/jobs";

type AnalyticsBriefProps = {
  jobs: TrackedJob[];
  tracks: Array<PortfolioTrackMeta & { count: number }>;
};

type LaneStats = {
  applied: number;
  interviews: number;
  total: number;
  track: PortfolioTrackMeta;
};

function getPercentage(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function buildLaneStats(jobs: TrackedJob[], tracks: AnalyticsBriefProps["tracks"]) {
  return tracks.map<LaneStats>((track) => {
    const laneJobs = jobs.filter((job) => job.track === track.slug);

    return {
      applied: laneJobs.filter((job) => job.applicationStatus === "APPLIED").length,
      interviews: laneJobs.filter((job) => job.applicationStatus === "INTERVIEWING").length,
      total: laneJobs.length,
      track,
    };
  });
}

export default function AnalyticsBrief({ jobs, tracks }: AnalyticsBriefProps) {
  const applied = jobs.filter((job) => job.applicationStatus === "APPLIED").length;
  const interviews = jobs.filter((job) => job.applicationStatus === "INTERVIEWING").length;
  const tracked = jobs.filter((job) => job.applicationStatus !== null).length;
  const responseRate = getPercentage(interviews, Math.max(applied, 1));
  const laneStats = buildLaneStats(jobs, tracks);

  return (
    <section className="rounded-panel border border-line bg-white p-6 shadow-card md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-500">
            Analytics brief
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
            Career lane performance at a glance
          </h2>
        </div>
        <div className="rounded-full border border-line bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
          {tracked} tracked
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total opportunities" value={jobs.length} />
        <Metric label="Applied" value={applied} tone="blue" />
        <Metric label="Interviewing" value={interviews} tone="green" />
        <Metric label="Interview rate" value={`${responseRate}%`} tone="amber" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {laneStats.map((lane) => {
          const appliedRate = getPercentage(lane.applied, lane.total);
          const interviewRate = getPercentage(lane.interviews, Math.max(lane.applied, 1));

          return (
            <article key={lane.track.slug} className="rounded-[1.5rem] border border-line bg-slate-50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-ink">{lane.track.shortName}</h3>
                  <p className="mt-1 text-sm text-slate-600">{lane.total} opportunities</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                  {lane.interviews} interviews
                </span>
              </div>

              <div className="mt-5 space-y-4">
                <ProgressBar label="Applied coverage" value={appliedRate} />
                <ProgressBar label="Interview conversion" value={interviewRate} accent />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Metric({
  label,
  tone = "default",
  value,
}: {
  label: string;
  tone?: "default" | "blue" | "green" | "amber";
  value: number | string;
}) {
  const toneClasses = {
    amber: "text-amber-700",
    blue: "text-sky-700",
    default: "text-ink",
    green: "text-emerald-700",
  };

  return (
    <article className="rounded-[1.5rem] border border-line bg-slate-50 p-5">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-slate-500">
        {label}
      </p>
      <p className={`mt-3 text-3xl font-semibold tracking-tight ${toneClasses[tone]}`}>
        {value}
      </p>
    </article>
  );
}

function ProgressBar({
  accent = false,
  label,
  value,
}: {
  accent?: boolean;
  label: string;
  value: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-white">
        <div
          className={`h-2 rounded-full ${accent ? "bg-emerald-500" : "bg-sky-500"}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
