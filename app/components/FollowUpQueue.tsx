import Link from "next/link";
import { getApplicationStatusLabel } from "@/lib/application-status";
import { type TrackedJob } from "@/lib/jobs";

type FollowUpQueueProps = {
  followUpJobs: TrackedJob[];
};

function formatFollowUpDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function FollowUpQueue({ followUpJobs }: FollowUpQueueProps) {
  return (
    <section className="rounded-panel border border-line bg-white p-6 shadow-card md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-500">
            Follow-up queue
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
            Today&apos;s application actions
          </h2>
        </div>
        <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          {followUpJobs.length} due
        </div>
      </div>

      {followUpJobs.length === 0 ? (
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center text-sm font-medium text-slate-500">
          No pending follow-ups for today.
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {followUpJobs.map((job) => (
            <Link
              key={job.applicationId ?? job.url}
              href={`/jobs/${job.track}`}
              className="border-l-4 border-amber-500 bg-slate-50 p-4 transition hover:bg-white hover:shadow-sm"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-semibold text-ink">{job.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{job.company}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                    Contact: {job.contactName || "N/A"}
                  </p>
                </div>
                <div className="space-y-2 md:text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                    Due: {formatFollowUpDate(job.followUpDate)}
                  </p>
                  <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                    {getApplicationStatusLabel(job.applicationStatus)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
