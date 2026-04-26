export type ApplicationStatus =
  | "SAVED"
  | "APPLIED"
  | "INTERVIEWING"
  | "OFFER"
  | "REJECTED"
  | "WITHDRAWN";

export const APPLICATION_STATUS_OPTIONS: ReadonlyArray<{
  label: string;
  value: ApplicationStatus;
}> = [
  { label: "Saved", value: "SAVED" },
  { label: "Applied", value: "APPLIED" },
  { label: "Interviewing", value: "INTERVIEWING" },
  { label: "Offer", value: "OFFER" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Withdrawn", value: "WITHDRAWN" },
];

export function getApplicationStatusLabel(status: ApplicationStatus | null) {
  const match = APPLICATION_STATUS_OPTIONS.find((item) => item.value === status);
  return match?.label ?? "Not tracked";
}
