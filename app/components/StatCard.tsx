type StatCardProps = {
  eyebrow: string;
  title: string;
  detail: string;
  tone?: "default" | "accent" | "ember";
};

const toneClasses: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "border-line bg-white",
  accent: "border-transparent bg-accentSoft",
  ember: "border-transparent bg-emberSoft",
};

export default function StatCard({
  eyebrow,
  title,
  detail,
  tone = "default",
}: StatCardProps) {
  return (
    <article
      className={`rounded-panel border p-5 shadow-card ${toneClasses[tone]}`}
    >
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-500">
        {eyebrow}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-ink">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
    </article>
  );
}
