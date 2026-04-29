'use client';

import {
  APPLICATION_STATUS_OPTIONS,
  type ApplicationStatus,
} from "@/lib/application-status";

export type JobStatusFilter = ApplicationStatus | "ALL" | "UNTRACKED";

type JobFilterBarProps = {
  onSearch: (term: string) => void;
  onStatusChange: (status: JobStatusFilter) => void;
  searchTerm: string;
  statusFilter: JobStatusFilter;
  trackedCount: number;
};

export default function JobFilterBar({
  onSearch,
  onStatusChange,
  searchTerm,
  statusFilter,
  trackedCount,
}: JobFilterBarProps) {
  return (
    <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="grid flex-1 gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
        <label className="sr-only" htmlFor="job-search">
          Search jobs
        </label>
        <input
          className="w-full rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-900"
          id="job-search"
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search jobs, companies, or locations..."
          type="search"
          value={searchTerm}
        />

        <label className="sr-only" htmlFor="job-status-filter">
          Filter by status
        </label>
        <select
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-900"
          id="job-status-filter"
          onChange={(event) => onStatusChange(event.target.value as JobStatusFilter)}
          value={statusFilter}
        >
          <option value="ALL">All statuses</option>
          <option value="UNTRACKED">Not tracked</option>
          {APPLICATION_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-full border border-line bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">
        {trackedCount} tracked
      </div>
    </div>
  );
}
