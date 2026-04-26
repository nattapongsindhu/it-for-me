import type { PortfolioTrackMeta, TrackedJob } from "@/lib/jobs";

type JobTableProps = {
  jobs: TrackedJob[];
  track: PortfolioTrackMeta;
};

function formatSalary(value: string) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric) || numeric <= 1) {
    return "Salary not listed";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(numeric);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function JobTable({ jobs, track }: JobTableProps) {
  return (
    <section className="rounded-panel border border-line bg-white shadow-card">
      <div className="border-b border-line px-6 py-5">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-500">
          Live sample feed
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
          {track.name} roles from the current job feed
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Phase 0 keeps the experience simple by reusing the existing `jobs.json` feed while organizing it into clearer career lanes.
        </p>
      </div>

      {jobs.length === 0 ? (
        <div className="px-6 py-12 text-sm leading-7 text-slate-600">
          No jobs are mapped to this lane yet. That is acceptable for Phase 0 because the main goal is to establish the layout, routing, and portfolio-ready structure first.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs uppercase tracking-[0.25em] text-slate-500">
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Company</th>
                <th className="px-6 py-4 font-semibold">Location</th>
                <th className="px-6 py-4 font-semibold">Posted</th>
                <th className="px-6 py-4 font-semibold">Match</th>
                <th className="px-6 py-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {jobs.map((job) => (
                <tr key={`${track.slug}-${job.url}`} className="align-top">
                  <td className="px-6 py-5">
                    <p className="font-semibold text-ink">{job.title}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {formatSalary(job.salary)} · {job.source}
                    </p>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-700">{job.company}</td>
                  <td className="px-6 py-5 text-sm text-slate-700">{job.location}</td>
                  <td className="px-6 py-5 text-sm text-slate-700">{formatDate(job.posted)}</td>
                  <td className="px-6 py-5">
                    <p className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {job.matchReason}
                    </p>
                  </td>
                  <td className="px-6 py-5">
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                    >
                      Review
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
