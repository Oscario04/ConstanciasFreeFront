export default function SkeletonGrid({ cards = 6 }: { cards?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: cards }).map((_, idx) => (
        <div key={idx} className="card animate-pulse">
          <div className="h-4 w-24 rounded bg-slate-200" />
          <div className="mt-3 h-5 w-3/4 rounded bg-slate-200" />
          <div className="mt-2 h-4 w-full rounded bg-slate-100" />
          <div className="mt-2 h-4 w-2/3 rounded bg-slate-100" />
          <div className="mt-6 h-8 w-full rounded bg-slate-200" />
        </div>
      ))}
    </div>
  )
}
