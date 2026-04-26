import jobFeed from "@/jobs.json";

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
      "engineer"
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
      "ux"
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
      "equipment support"
    ],
  },
];

const jobs = (jobFeed.jobs as RawJob[]).map((job) => ({
  ...job,
  type: job.type?.trim() || "Open",
}));

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

export function getTracks(): PortfolioTrackMeta[] {
  return TRACKS.map(({ keywords, ...track }) => track);
}

export function getFeedSummary() {
  return {
    count: jobFeed.count,
    radiusMiles: jobFeed.radius_mi,
    updated: jobFeed.updated,
    zip: jobFeed.zip,
  };
}

export function getTrackJobs(trackSlug: PortfolioTrack) {
  const track = TRACKS.find((item) => item.slug === trackSlug);

  if (!track) {
    return [];
  }

  const matched = jobs
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

export function getLatestPriorityJobs(limit = 8) {
  const items = TRACKS.flatMap((track) => getTrackJobs(track.slug));
  const uniqueJobs = Array.from(
    new Map(items.map((job) => [job.url, job])).values()
  );

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
