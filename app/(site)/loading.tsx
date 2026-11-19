// Skeleton shown while a dynamic site page is being fetched (DESIGN.md: "loading skeletons").
export default function Loading() {
  return (
    <div className="max-w-[1100px] mx-auto px-5 pt-16" aria-busy="true" aria-label="กำลังโหลด">
      <div className="skeleton h-4 w-28" />
      <div className="skeleton h-12 w-2/3 mt-4" />
      <div className="skeleton h-5 w-1/2 mt-4" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
        {[0, 1, 2].map(i => <div key={i} className="rounded-[28px] bg-white border border-[var(--line)] overflow-hidden"><div className="skeleton h-44 !rounded-none" /><div className="p-5 space-y-3"><div className="skeleton h-4 w-24" /><div className="skeleton h-6 w-4/5" /><div className="skeleton h-4 w-full" /></div></div>)}
      </div>
    </div>
  );
}
