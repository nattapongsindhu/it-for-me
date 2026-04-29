import JobTableSkeleton from "@/app/components/JobTableSkeleton";

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-panel border border-line bg-white p-5 shadow-card">
      <div className="h-3 w-28 rounded-full bg-slate-200" />
      <div className="mt-4 h-9 w-20 rounded-full bg-slate-200" />
      <div className="mt-4 h-4 w-full rounded-full bg-slate-100" />
      <div className="mt-2 h-4 w-2/3 rounded-full bg-slate-100" />
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <section className="animate-pulse rounded-panel border border-line bg-white p-5 shadow-card md:p-8">
        <div className="h-3 w-40 rounded-full bg-slate-200" />
        <div className="mt-5 h-10 w-full max-w-3xl rounded-full bg-slate-200" />
        <div className="mt-3 h-10 w-2/3 rounded-full bg-slate-200" />
        <div className="mt-6 h-4 w-full max-w-4xl rounded-full bg-slate-100" />
        <div className="mt-2 h-4 w-3/4 rounded-full bg-slate-100" />
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>

      <JobTableSkeleton />
    </div>
  );
}
