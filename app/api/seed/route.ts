import { NextResponse } from "next/server";
import jobFeed from "@/jobs.json";
import { getBestTrackForJob, type PortfolioTrack, type RawJob } from "@/lib/jobs";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseServiceRoleKey } from "@/lib/supabase/env";

type SeedRow = {
  company: string;
  employment_type: string | null;
  last_seen_at: string;
  location_text: string;
  posted_date: string | null;
  remote_mode: string | null;
  salary_max: number | null;
  salary_min: number | null;
  salary_text: string | null;
  source: string;
  source_key: string;
  status: "OPEN";
  title: string;
  track_slug: PortfolioTrack;
  url: string;
};

export const dynamic = "force-dynamic";

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function createSourceKey(job: RawJob) {
  return `${normalizeText(job.source).toLowerCase()}::${normalizeText(job.url).toLowerCase()}`;
}

function parseSalaryRange(value: string) {
  const digits = value.match(/\d[\d,]*/g)?.map((item) => Number(item.replace(/,/g, ""))) ?? [];

  if (digits.length === 0) {
    return {
      salaryMax: null,
      salaryMin: null,
    };
  }

  if (digits.length === 1) {
    return {
      salaryMax: digits[0],
      salaryMin: digits[0],
    };
  }

  return {
    salaryMax: Math.max(...digits),
    salaryMin: Math.min(...digits),
  };
}

function inferRemoteMode(job: RawJob) {
  const haystack = `${job.location} ${job.type}`.toLowerCase();

  if (haystack.includes("remote")) {
    return "Remote";
  }

  if (haystack.includes("hybrid")) {
    return "Hybrid";
  }

  if (haystack.includes("onsite") || haystack.includes("on-site")) {
    return "On-site";
  }

  return null;
}

function toSeedRow(job: RawJob, lastSeenAt: string) {
  const bestTrack = getBestTrackForJob(job);

  if (!bestTrack) {
    return null;
  }

  const salary = parseSalaryRange(job.salary);
  const postedDate = normalizeText(job.posted);

  return {
    company: normalizeText(job.company),
    employment_type: job.type.trim() || null,
    last_seen_at: lastSeenAt,
    location_text: normalizeText(job.location),
    posted_date: postedDate || null,
    remote_mode: inferRemoteMode(job),
    salary_max: salary.salaryMax,
    salary_min: salary.salaryMin,
    salary_text: job.salary.trim() || null,
    source: normalizeText(job.source),
    source_key: createSourceKey(job),
    status: "OPEN" as const,
    title: normalizeText(job.title),
    track_slug: bestTrack.track,
    url: normalizeText(job.url),
  } satisfies SeedRow;
}

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        error: "The seed route is disabled in production. Run it from local development only.",
      },
      { status: 403 }
    );
  }

  if (!hasSupabaseServiceRoleKey()) {
    return NextResponse.json(
      {
        error:
          "SUPABASE_SERVICE_ROLE_KEY is missing in .env.local. Add it before running /api/seed.",
      },
      { status: 500 }
    );
  }

  const rawJobs = jobFeed.jobs as RawJob[];
  const preparedRows = rawJobs
    .map((job) => toSeedRow(job, jobFeed.updated))
    .filter((job): job is SeedRow => job !== null);

  const skippedJobs = rawJobs.length - preparedRows.length;
  const trackCounts = preparedRows.reduce<Record<PortfolioTrack, number>>(
    (counts, job) => {
      counts[job.track_slug] += 1;
      return counts;
    },
    {
      "biomedical-device": 0,
      "facilities-tech": 0,
      "it-helpdesk": 0,
    }
  );

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("jobs")
      .upsert(preparedRows, { onConflict: "source_key" })
      .select("source_key");

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Seed completed successfully.",
      sourceUpdatedAt: jobFeed.updated,
      totalFeedJobs: rawJobs.length,
      upsertedRows: data?.length ?? preparedRows.length,
      skippedJobs,
      trackCounts,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown seed error.";

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}
