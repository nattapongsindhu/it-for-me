import { NextResponse } from "next/server";
import {
  APPLICATION_STATUS_OPTIONS,
  type ApplicationStatus,
} from "@/lib/application-status";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseServiceRoleKey } from "@/lib/supabase/env";

type UpdatePayload = {
  status?: string;
  jobId?: string;
};

type ExistingApplication = {
  applied_date: string | null;
  company_snapshot: string;
  id: string;
  interview_date: string | null;
  job_id: string | null;
  job_title_snapshot: string;
  status: ApplicationStatus;
  track_slug: string;
};

type JobSnapshot = {
  company: string;
  id: string;
  title: string;
  track_slug: string;
};

const VALID_STATUSES = new Set(APPLICATION_STATUS_OPTIONS.map((item) => item.value));

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeStatus(status: string | undefined) {
  if (!status) {
    return null;
  }

  const normalized = status.trim().toUpperCase();
  return VALID_STATUSES.has(normalized as ApplicationStatus)
    ? (normalized as ApplicationStatus)
    : null;
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        error:
          "Application status updates are disabled in production until an authenticated workflow is added.",
      },
      { status: 403 }
    );
  }

  if (!hasSupabaseServiceRoleKey()) {
    return NextResponse.json(
      {
        error: "SUPABASE_SERVICE_ROLE_KEY is missing in .env.local.",
      },
      { status: 500 }
    );
  }

  const body = (await request.json().catch(() => null)) as UpdatePayload | null;
  const jobId = body?.jobId?.trim();
  const status = normalizeStatus(body?.status);

  if (!jobId || !status) {
    return NextResponse.json(
      {
        error: "A valid jobId and status are required.",
      },
      { status: 400 }
    );
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data: jobData, error: jobError } = await supabase
      .from("jobs")
      .select("company, id, title, track_slug")
      .eq("id", jobId)
      .limit(1)
      .maybeSingle();

    if (jobError || !jobData) {
      return NextResponse.json(
        {
          error: "The requested job could not be found.",
        },
        { status: 404 }
      );
    }

    const job = jobData as JobSnapshot;
    const { data: existingData, error: existingError } = await supabase
      .from("applications")
      .select(
        "applied_date, company_snapshot, id, interview_date, job_id, job_title_snapshot, status, track_slug"
      )
      .eq("job_id", jobId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        {
          error: existingError.message,
        },
        { status: 500 }
      );
    }

    const today = todayDateString();
    const existingApplication = existingData as ExistingApplication | null;
    const nextAppliedDate =
      status === "APPLIED" || status === "INTERVIEWING" || status === "OFFER"
        ? existingApplication?.applied_date ?? today
        : existingApplication?.applied_date ?? null;
    const nextInterviewDate =
      status === "INTERVIEWING" || status === "OFFER"
        ? existingApplication?.interview_date ?? today
        : existingApplication?.interview_date ?? null;

    if (existingApplication) {
      const { error: updateError } = await supabase
        .from("applications")
        .update({
          applied_date: nextAppliedDate,
          company_snapshot: job.company,
          interview_date: nextInterviewDate,
          job_title_snapshot: job.title,
          status,
          status_updated_at: new Date().toISOString(),
          track_slug: job.track_slug,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingApplication.id);

      if (updateError) {
        return NextResponse.json(
          {
            error: updateError.message,
          },
          { status: 500 }
        );
      }
    } else {
      const { error: insertError } = await supabase.from("applications").insert({
        applied_date: nextAppliedDate,
        company_snapshot: job.company,
        interview_date: nextInterviewDate,
        job_id: job.id,
        job_title_snapshot: job.title,
        status,
        status_updated_at: new Date().toISOString(),
        track_slug: job.track_slug,
      });

      if (insertError) {
        return NextResponse.json(
          {
            error: insertError.message,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      jobId,
      message: "Application status saved successfully.",
      status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown application update error.",
      },
      { status: 500 }
    );
  }
}
