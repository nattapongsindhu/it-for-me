import jobFeed from "@/jobs.json";
import { cache } from "react";
import {
  getApplicationStatusLabel as getSharedApplicationStatusLabel,
  type ApplicationStatus,
} from "@/lib/application-status";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv, hasSupabaseServiceRoleKey } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PortfolioTrack =
  | "biomedical-device"
  | "it-helpdesk"
  | "facilities-tech"
  | "hospital-careers";

export type PortfolioTrackMeta = {
  slug: PortfolioTrack;
  name: string;
  shortName: string;
  description: string;
  focus: string;
};

export type RawJob = {
  company: string;
  location: string;
  posted: string;
  salary: string;
  source: string;
  title: string;
  type: string;
  url: string;
};

export type TrackedJob = RawJob & {
  applicationId: string | null;
  applicationStatus: ApplicationStatus | null;
  appliedDate: string | null;
  contactEmail: string | null;
  contactName: string | null;
  followUpDate: string | null;
  interviewDate: string | null;
  jobId: string | null;
  matchReason: string;
  notes: string | null;
  sourceKey: string | null;
  track: PortfolioTrack;
};

export type FeedSummary = {
  count: number;
  radiusMiles: number;
  updated: string;
  zip: string;
};

export type ApplicationSummary = {
  applied: number;
  interviewing: number;
  offers: number;
  rejected: number;
  saved: number;
  tracked: number;
  withdrawn: number;
};

type JobRow = {
  company: string;
  created_at: string;
  description: string | null;
  employment_type: string | null;
  id: string;
  last_seen_at: string;
  location_text: string;
  posted_date: string | null;
  remote_mode: string | null;
  salary_max: number | null;
  salary_min: number | null;
  salary_text: string | null;
  source: string;
  source_key: string;
  status: string;
  title: string;
  track_slug: PortfolioTrack;
  updated_at: string;
  url: string;
};

type ApplicationRow = {
  applied_date: string | null;
  contact_email: string | null;
  contact_name: string | null;
  follow_up_date: string | null;
  id: string;
  interview_date: string | null;
  job_id: string | null;
  notes: string | null;
  status: ApplicationStatus;
  updated_at: string;
};

type TrackDefinition = PortfolioTrackMeta & {
  keywords: string[];
};

const TRACKS: TrackDefinition[] = [
  {
    slug: "biomedical-device",
    name: "Biomedical & Device",
    shortName: "Biomedical",
    description:
      "Focuses on hospital equipment support, clinical engineering pathways, medical devices, and healthcare-adjacent technical roles.",
    focus:
      "Best for showing progression from hands-on maintenance into healthcare technology and equipment reliability.",
    keywords: [
      "biomedical",
      "clinical",
      "hospital",
      "medical device",
      "medical",
      "healthcare",
      "imaging",
      "patient care",
      "sterile",
      "health administration",
      "health",
      "equipment",
      "engineer",
    ],
  },
  {
    slug: "it-helpdesk",
    name: "IT & Helpdesk",
    shortName: "IT",
    description:
      "Focuses on entry-level to mid-level IT support, endpoint operations, healthcare IT, and technical support roles.",
    focus:
      "Best for building a practical bridge into support operations, troubleshooting, systems work, and internal technology teams.",
    keywords: [
      "information technology",
      "it ",
      "it-",
      "it specialist",
      "helpdesk",
      "desktop",
      "support",
      "technology",
      "cyber",
      "network",
      "systems",
      "datamgt",
      "operations center",
      "data scientist",
      "ux",
    ],
  },
  {
    slug: "facilities-tech",
    name: "Facilities & Tech",
    shortName: "Facilities",
    description:
      "Focuses on maintenance, engineering, field operations, and technician roles that align with the user's USPS maintenance background.",
    focus:
      "Best for translating existing maintenance experience into a clear, credible technical portfolio lane.",
    keywords: [
      "maintenance",
      "mechanic",
      "facilities",
      "engineer",
      "engineering technician",
      "electronic engineer",
      "technician",
      "field service",
      "pneumatic",
      "reliability",
      "operations",
      "equipment support",
    ],
  },
  {
    slug: "hospital-careers",
    name: "Hospital Careers",
    shortName: "Hospitals",
    description:
      "Focuses on direct hospital career sources across Greater Los Angeles medical centers.",
    focus:
      "Phase 5 will connect hospital career boards for Healthcare IT, BMET, facilities, and technical support opportunities.",
    keywords: [],
  },
];

const localJobs = (jobFeed.jobs as RawJob[]).map((job) => ({
  ...job,
  type: job.type?.trim() || "Open",
}));

const localSummary: FeedSummary = {
  count: jobFeed.count,
  radiusMiles: jobFeed.radius_mi,
  updated: jobFeed.updated,
  zip: jobFeed.zip,
};

function buildSearchText(job: RawJob) {
  return `${job.title} ${job.company} ${job.location}`.toLowerCase();
}

function getTrackMatches(job: RawJob, track: TrackDefinition) {
  const haystack = buildSearchText(job);
  return track.keywords.filter((keyword) => haystack.includes(keyword.toLowerCase()));
}

export function getBestTrackForJob(job: RawJob) {
  const ranked = TRACKS.map((track) => ({
    matches: getTrackMatches(job, track),
    track,
  }))
    .filter((item) => item.matches.length > 0)
    .sort((left, right) => right.matches.length - left.matches.length);

  if (ranked.length === 0) {
    return null;
  }

  return {
    matchReason: `Matched: ${ranked[0].matches.slice(0, 3).join(", ")}`,
    track: ranked[0].track.slug,
  };
}

function sortJobs(items: TrackedJob[]) {
  return [...items].sort((left, right) => {
    const rightTime = new Date(right.posted).getTime();
    const leftTime = new Date(left.posted).getTime();
    return rightTime - leftTime;
  });
}

function buildSalaryText(row: JobRow) {
  if (row.salary_text?.trim()) {
    return row.salary_text.trim();
  }

  if (typeof row.salary_min === "number" && typeof row.salary_max === "number") {
    return `${row.salary_min}-${row.salary_max}`;
  }

  if (typeof row.salary_min === "number") {
    return `${row.salary_min}`;
  }

  if (typeof row.salary_max === "number") {
    return `${row.salary_max}`;
  }

  return "";
}

function mapJobRowToRawJob(row: JobRow): RawJob {
  return {
    company: row.company,
    location: row.location_text,
    posted: row.posted_date ?? row.created_at.slice(0, 10),
    salary: buildSalaryText(row),
    source: row.source,
    title: row.title,
    type: row.employment_type?.trim() || row.remote_mode?.trim() || "Open",
    url: row.url,
  };
}

function mapJobRowToTrackedJob(
  row: JobRow,
  application: ApplicationRow | undefined,
  matchReason: string
): TrackedJob {
  return {
    ...mapJobRowToRawJob(row),
    applicationId: application?.id ?? null,
    applicationStatus: application?.status ?? null,
    appliedDate: application?.applied_date ?? null,
    contactEmail: application?.contact_email ?? null,
    contactName: application?.contact_name ?? null,
    followUpDate: application?.follow_up_date ?? null,
    interviewDate: application?.interview_date ?? null,
    jobId: row.id,
    matchReason,
    notes: application?.notes ?? null,
    sourceKey: row.source_key,
    track: row.track_slug,
  };
}

function buildSummaryFromRows(rows: JobRow[]): FeedSummary {
  const updated = rows.reduce((latest, row) => {
    const candidate = row.last_seen_at || row.updated_at || row.created_at;
    return candidate > latest ? candidate : latest;
  }, localSummary.updated);

  return {
    count: rows.length,
    radiusMiles: localSummary.radiusMiles,
    updated,
    zip: localSummary.zip,
  };
}

function buildApplicationSummary(rows: TrackedJob[]): ApplicationSummary {
  return rows.reduce<ApplicationSummary>(
    (summary, row) => {
      if (!row.applicationStatus) {
        return summary;
      }

      summary.tracked += 1;

      switch (row.applicationStatus) {
        case "SAVED":
          summary.saved += 1;
          break;
        case "APPLIED":
          summary.applied += 1;
          break;
        case "INTERVIEWING":
          summary.interviewing += 1;
          break;
        case "OFFER":
          summary.offers += 1;
          break;
        case "REJECTED":
          summary.rejected += 1;
          break;
        case "WITHDRAWN":
          summary.withdrawn += 1;
          break;
      }

      return summary;
    },
    {
      applied: 0,
      interviewing: 0,
      offers: 0,
      rejected: 0,
      saved: 0,
      tracked: 0,
      withdrawn: 0,
    }
  );
}

export function getFollowUpJobs(jobs: TrackedJob[]) {
  const today = new Date().toISOString().slice(0, 10);

  return jobs
    .filter((job) => {
      if (!job.applicationStatus || !job.followUpDate) {
        return false;
      }

      return (
        job.followUpDate <= today &&
        !["OFFER", "REJECTED", "WITHDRAWN"].includes(job.applicationStatus)
      );
    })
    .sort((left, right) => {
      if (left.followUpDate === right.followUpDate) {
        return left.title.localeCompare(right.title);
      }

      return (left.followUpDate ?? "").localeCompare(right.followUpDate ?? "");
    });
}

async function loadApplicationsByJobId(jobIds: string[]) {
  if (!hasSupabaseServiceRoleKey() || jobIds.length === 0) {
    return new Map<string, ApplicationRow>();
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("applications")
      .select(
        "applied_date, contact_email, contact_name, follow_up_date, id, interview_date, job_id, notes, status, updated_at"
      )
      .in("job_id", jobIds)
      .order("updated_at", { ascending: false });

    if (error || !data) {
      return new Map<string, ApplicationRow>();
    }

    const rows = data as ApplicationRow[];
    const applications = new Map<string, ApplicationRow>();

    for (const row of rows) {
      if (!row.job_id || applications.has(row.job_id)) {
        continue;
      }

      applications.set(row.job_id, row);
    }

    return applications;
  } catch {
    return new Map<string, ApplicationRow>();
  }
}

const loadJobsFromSupabase = cache(async function loadJobsFromSupabase() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("jobs")
      .select(
        "company, created_at, description, employment_type, id, last_seen_at, location_text, posted_date, remote_mode, salary_max, salary_min, salary_text, source, source_key, status, title, track_slug, updated_at, url"
      )
      .neq("status", "ARCHIVED")
      .order("posted_date", { ascending: false, nullsFirst: false });

    if (error || !data) {
      return null;
    }

    const rows = data as JobRow[];
    const applicationsByJobId = await loadApplicationsByJobId(rows.map((row) => row.id));
    const jobs = rows.map((row) =>
      mapJobRowToTrackedJob(
        row,
        applicationsByJobId.get(row.id),
        "Loaded from the Supabase portfolio catalog."
      )
    );

    return {
      applicationSummary: buildApplicationSummary(jobs),
      jobs,
      summary: buildSummaryFromRows(rows),
    };
  } catch {
    return null;
  }
});

export function getTracks(): PortfolioTrackMeta[] {
  return TRACKS.map(({ keywords, ...track }) => track);
}

export function getApplicationStatusLabel(status: ApplicationStatus | null) {
  return getSharedApplicationStatusLabel(status);
}

export async function getFeedSummary() {
  const supabaseFeed = await loadJobsFromSupabase();
  return supabaseFeed?.summary ?? localSummary;
}

export async function getApplicationSummary() {
  const supabaseFeed = await loadJobsFromSupabase();

  return (
    supabaseFeed?.applicationSummary ?? {
      applied: 0,
      interviewing: 0,
      offers: 0,
      rejected: 0,
      saved: 0,
      tracked: 0,
      withdrawn: 0,
    }
  );
}

export async function getTrackJobs(trackSlug: PortfolioTrack) {
  const track = TRACKS.find((item) => item.slug === trackSlug);

  if (!track) {
    return [];
  }

  const supabaseFeed = await loadJobsFromSupabase();

  if (supabaseFeed) {
    return sortJobs(supabaseFeed.jobs.filter((job) => job.track === trackSlug));
  }

  const matched = localJobs.reduce<TrackedJob[]>((accumulator, job) => {
    const matches = getTrackMatches(job, track);

    if (matches.length === 0) {
      return accumulator;
    }

    accumulator.push({
      ...job,
      applicationId: null,
      applicationStatus: null,
      appliedDate: null,
      contactEmail: null,
      contactName: null,
      followUpDate: null,
      interviewDate: null,
      jobId: null,
      matchReason: `Matched: ${matches.slice(0, 3).join(", ")}`,
      notes: null,
      sourceKey: null,
      track: track.slug,
    });

    return accumulator;
  }, []);

  return sortJobs(matched);
}

export async function getLatestPriorityJobs(limit = 8) {
  const supabaseFeed = await loadJobsFromSupabase();

  if (supabaseFeed) {
    return sortJobs(supabaseFeed.jobs).slice(0, limit);
  }

  const trackJobs = await Promise.all(TRACKS.map((track) => getTrackJobs(track.slug)));
  const items = trackJobs.flat();
  const uniqueJobs = Array.from(new Map(items.map((job) => [job.url, job])).values());

  return sortJobs(uniqueJobs).slice(0, limit);
}

export async function getAllPortfolioJobs() {
  const supabaseFeed = await loadJobsFromSupabase();

  if (supabaseFeed) {
    return sortJobs(supabaseFeed.jobs);
  }

  const trackJobs = await Promise.all(TRACKS.map((track) => getTrackJobs(track.slug)));
  const items = trackJobs.flat();
  return sortJobs(Array.from(new Map(items.map((job) => [job.url, job])).values()));
}

export function getTrackBySlug(trackSlug: PortfolioTrack) {
  const track = TRACKS.find((item) => item.slug === trackSlug);

  if (!track) {
    throw new Error(`Unknown portfolio track: ${trackSlug}`);
  }

  const { keywords, ...meta } = track;
  return meta;
}

export function getRoadmap() {
  return [
    {
      phase: "Phase 0",
      title: "Foundation & UI Shell",
      estimate: "1 day",
      items: [
        "Upgrade the repo from a static job feed into a clean Next.js portfolio shell.",
        "Establish the sidebar, route structure, and category lanes.",
        "Reuse jobs.json as a lightweight local data source for previews.",
      ],
    },
    {
      phase: "Phase 1",
      title: "Database & Data Fetching",
      estimate: "2 to 3 days",
      items: [
        "Introduce Supabase and define jobs plus applications tables.",
        "Connect category pages to structured records instead of relying only on local JSON.",
        "Create a clean table model that is easy to extend.",
      ],
    },
    {
      phase: "Phase 2",
      title: "Job Tracking Operations",
      estimate: "2 to 3 days",
      items: [
        "Add create, update, and detail flows for tracked applications.",
        "Introduce status changes such as Applied, Interviewing, and Rejected.",
        "Keep the implementation beginner-friendly and easy to modify.",
      ],
    },
    {
      phase: "Phase 3",
      title: "Dashboard & Analytics",
      estimate: "1 to 2 days",
      items: [
        "Add summary cards and simple progress reporting.",
        "Show portfolio-ready operational signals instead of complex BI.",
        "Highlight current job targets and application activity.",
      ],
    },
    {
      phase: "Phase 4",
      title: "Final Polish & Deployment",
      estimate: "1 day",
      items: [
        "Improve responsive behavior and clean up the last UX details.",
        "Refresh documentation and recruiter-facing messaging.",
        "Deploy to Vercel and finalize the portfolio presentation.",
      ],
    },
  ];
}
