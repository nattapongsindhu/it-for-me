import { NextResponse } from "next/server";
import { type ApplicationStatus } from "@/lib/application-status";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseServiceRoleKey } from "@/lib/supabase/env";

type DetailsPayload = {
  appliedDate?: string | null;
  contactEmail?: string | null;
  contactName?: string | null;
  followUpDate?: string | null;
  interviewDate?: string | null;
  jobId?: string;
  notes?: string | null;
};

type ExistingApplication = {
  id: string;
  status: ApplicationStatus;
};

type JobSnapshot = {
  company: string;
  id: string;
  title: string;
  track_slug: string;
};

function normalizeNullableText(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}

function normalizeNullableDate(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        error:
          "Application detail updates are disabled in production until an authenticated workflow is added.",
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

  const body = (await request.json().catch(() => null)) as DetailsPayload | null;
  const jobId = body?.jobId?.trim();

  if (!jobId) {
    return NextResponse.json(
      {
        error: "A valid jobId is required.",
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
      .select("id, status")
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

    const payload = {
      applied_date: normalizeNullableDate(body?.appliedDate),
      company_snapshot: job.company,
      contact_email: normalizeNullableText(body?.contactEmail),
      contact_name: normalizeNullableText(body?.contactName),
      follow_up_date: normalizeNullableDate(body?.followUpDate),
      interview_date: normalizeNullableDate(body?.interviewDate),
      job_title_snapshot: job.title,
      notes: normalizeNullableText(body?.notes),
      track_slug: job.track_slug,
      updated_at: new Date().toISOString(),
    };

    const existingApplication = existingData as ExistingApplication | null;

    if (existingApplication) {
      const { error: updateError } = await supabase
        .from("applications")
        .update(payload)
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
        ...payload,
        job_id: job.id,
        status: "SAVED",
        status_updated_at: new Date().toISOString(),
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
      message: "Application details saved successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown application details error.",
      },
      { status: 500 }
    );
  }
}
