export default function JobTableSkeleton() {
  return (
    <div className="animate-pulse rounded-panel border border-line bg-white p-5 shadow-card">
      <div className="space-y-4">
        <div className="h-10 w-full rounded-full bg-slate-200" />
        {[...Array(5)].map((_, index) => (
          <div
            key={index}
            className="h-20 w-full rounded-[1rem] border border-slate-200 bg-slate-100"
          />
        ))}
      </div>
    </div>
  );
}
