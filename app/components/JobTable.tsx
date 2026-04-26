'use client';

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  APPLICATION_STATUS_OPTIONS,
  getApplicationStatusLabel,
  type ApplicationStatus,
} from "@/lib/application-status";
import { type PortfolioTrackMeta, type TrackedJob } from "@/lib/jobs";

type JobTableProps = {
  jobs: TrackedJob[];
  track: PortfolioTrackMeta;
};

type StatusMap = Record<string, ApplicationStatus | null>;

const statusBadgeClasses: Record<string, string> = {
  APPLIED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  INTERVIEWING: "border-sky-200 bg-sky-50 text-sky-700",
  OFFER: "border-violet-200 bg-violet-50 text-violet-700",
  REJECTED: "border-rose-200 bg-rose-50 text-rose-700",
  SAVED: "border-amber-200 bg-amber-50 text-amber-700",
  UNTRACKED: "border-slate-200 bg-slate-50 text-slate-600",
  WITHDRAWN: "border-slate-300 bg-slate-100 text-slate-700",
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

function getStatusKey(status: ApplicationStatus | null) {
  return status ?? "UNTRACKED";
}

export default function JobTable({ jobs, track }: JobTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const trackingEnabled = process.env.NODE_ENV !== "production";
  const [statusMap, setStatusMap] = useState<StatusMap>(() =>
    jobs.reduce<StatusMap>((accumulator, job) => {
      accumulator[job.url] = job.applicationStatus;
      return accumulator;
    }, {})
  );

  const trackedCount = useMemo(
    () => Object.values(statusMap).filter((status) => status !== null).length,
    [statusMap]
  );

  async function updateStatus(job: TrackedJob, nextStatus: ApplicationStatus) {
    if (!job.jobId) {
      setErrorMessage("This row is still using local preview data and cannot be tracked yet.");
      return;
    }

    const previousStatus = statusMap[job.url] ?? null;
    setErrorMessage(null);
    setStatusMap((current) => ({
      ...current,
      [job.url]: nextStatus,
    }));

    startTransition(async () => {
      try {
        const response = await fetch("/api/applications/status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jobId: job.jobId,
            status: nextStatus,
          }),
        });

        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;

        if (!response.ok) {
          throw new Error(payload?.error ?? "Unable to save the application status.");
        }

        router.refresh();
      } catch (error) {
        setStatusMap((current) => ({
          ...current,
          [job.url]: previousStatus,
        }));
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to save the application status."
        );
      }
    });
  }

  return (
    <section className="rounded-panel border border-line bg-white shadow-card">
      <div className="border-b border-line px-6 py-5">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-500">
          Portfolio job tracker
        </p>
        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-ink">
              {track.name} roles from the current portfolio catalog
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              The table now supports lightweight application tracking while keeping the workflow
              clean and beginner-friendly.
            </p>
            {!trackingEnabled ? (
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                Tracking updates are local-only until an authenticated production flow is added.
              </p>
            ) : null}
          </div>
          <div className="rounded-full border border-line bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">
            {trackedCount} tracked
          </div>
        </div>
        {errorMessage ? (
          <p className="mt-4 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </p>
        ) : null}
      </div>

      {jobs.length === 0 ? (
        <div className="px-6 py-12 text-sm leading-7 text-slate-600">
          No jobs are mapped to this lane yet. That is acceptable while the catalog grows because
          the main goal is to keep the portfolio structure clean and easy to extend.
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
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Match</th>
                <th className="px-6 py-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {jobs.map((job) => {
                const currentStatus = statusMap[job.url] ?? null;
                const badgeKey = getStatusKey(currentStatus);
                return (
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
                      <div className="space-y-3">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${statusBadgeClasses[badgeKey]}`}
                        >
                          {getApplicationStatusLabel(currentStatus)}
                        </span>
                        <select
                          aria-label={`Application status for ${job.title}`}
                          className="w-full min-w-[180px] rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-900"
                          disabled={isPending || !trackingEnabled}
                          onChange={(event) => {
                            const nextStatus = event.target.value as ApplicationStatus;
                            if (!nextStatus || nextStatus === currentStatus) {
                              return;
                            }

                            void updateStatus(job, nextStatus);
                          }}
                          value={currentStatus ?? ""}
                        >
                          <option value="">Select status</option>
                          {APPLICATION_STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
