import jobFeed from "@/jobs.json";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export type PortfolioTrack = "biomedical-device" | "it-helpdesk" | "facilities-tech";

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
  matchReason: string;
  track: PortfolioTrack;
};

type FeedSummary = {
  count: number;
  radiusMiles: number;
  updated: string;
  zip: string;
};

type JobRow = {
  company: string;
  created_at: string;
  description: string | null;
  employment_type: string | null;
  last_seen_at: string;
  location_text: string;
  posted_date: string | null;
  remote_mode: string | null;
  salary_max: number | null;
  salary_min: number | null;
  salary_text: string | null;
  source: string;
  status: string;
  title: string;
  track_slug: PortfolioTrack;
  updated_at: string;
  url: string;
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

async function loadJobsFromSupabase() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("jobs")
      .select(
        "company, created_at, description, employment_type, last_seen_at, location_text, posted_date, remote_mode, salary_max, salary_min, salary_text, source, status, title, track_slug, updated_at, url"
      )
      .neq("status", "ARCHIVED")
      .order("posted_date", { ascending: false, nullsFirst: false });

    if (error || !data) {
      return null;
    }

    const rows = data as JobRow[];

    return {
      jobs: rows.map(mapJobRowToRawJob),
      summary: buildSummaryFromRows(rows),
    };
  } catch {
    return null;
  }
}

export function getTracks(): PortfolioTrackMeta[] {
  return TRACKS.map(({ keywords, ...track }) => track);
}

export async function getFeedSummary() {
  const supabaseFeed = await loadJobsFromSupabase();
  return supabaseFeed?.summary ?? localSummary;
}

export async function getTrackJobs(trackSlug: PortfolioTrack) {
  const track = TRACKS.find((item) => item.slug === trackSlug);

  if (!track) {
    return [];
  }

  const supabaseFeed = await loadJobsFromSupabase();
  const sourceJobs = supabaseFeed?.jobs ?? localJobs;

  const matched = sourceJobs
    .map((job) => {
      const matches = getTrackMatches(job, track);

      if (matches.length === 0) {
        return null;
      }

      return {
        ...job,
        track: track.slug,
        matchReason: `Matched: ${matches.slice(0, 3).join(", ")}`,
      } satisfies TrackedJob;
    })
    .filter((job): job is TrackedJob => job !== null);

  return sortJobs(matched);
}

export async function getLatestPriorityJobs(limit = 8) {
  const trackJobs = await Promise.all(TRACKS.map((track) => getTrackJobs(track.slug)));
  const items = trackJobs.flat();
  const uniqueJobs = Array.from(new Map(items.map((job) => [job.url, job])).values());

  return sortJobs(uniqueJobs).slice(0, limit);
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
        "Upgrade the repo from a static job feed into a clean Next.js portfolio shell",
        "Establish the sidebar, route structure, and category lanes",
        "Reuse jobs.json as a lightweight local data source for previews",
      ],
    },
    {
      phase: "Phase 1",
      title: "Database & Data Fetching",
      estimate: "2 to 3 days",
      items: [
        "Introduce Supabase and define jobs plus applications tables",
        "Connect category pages to structured records instead of only local JSON",
        "Create a clean table model that is easy to extend",
      ],
    },
    {
      phase: "Phase 2",
      title: "Job Tracking Operations",
      estimate: "2 to 3 days",
      items: [
        "Add create, update, and detail flows for tracked applications",
        "Introduce status changes such as Applied, Interviewing, and Rejected",
        "Keep the implementation beginner-friendly and easy to modify",
      ],
    },
    {
      phase: "Phase 3",
      title: "Dashboard & Analytics",
      estimate: "1 to 2 days",
      items: [
        "Add summary cards and simple progress reporting",
        "Show portfolio-ready operational signals instead of complex BI",
        "Highlight current job targets and application activity",
      ],
    },
    {
      phase: "Phase 4",
      title: "Final Polish & Deployment",
      estimate: "1 day",
      items: [
        "Improve responsive behavior and clean up the last UX details",
        "Refresh documentation and recruiter-facing messaging",
        "Deploy to Vercel and finalize the portfolio presentation",
      ],
    },
  ];
}
