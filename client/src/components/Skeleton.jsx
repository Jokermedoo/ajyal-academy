export function CardSkeleton({ count = 4 }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 animate-pulse">
          <div className="h-10 w-10 rounded-xl bg-slate-200 mb-3" />
          <div className="h-4 w-2/3 bg-slate-200 rounded mb-2" />
          <div className="h-3 w-full bg-slate-100 rounded" />
        </div>
      ))}
    </div>
  );
}

export function TextSkeleton({ lines = 3 }) {
  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 bg-slate-200 rounded" style={{ width: `${90 - i * 12}%` }} />
      ))}
    </div>
  );
}