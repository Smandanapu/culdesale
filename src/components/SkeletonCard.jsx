export default function SkeletonCard() {
  return (
    <div className="card-gradient-border bg-white dark:bg-white/[0.015] backdrop-blur-md border border-slate-200 dark:border-white/[0.04] rounded-2xl overflow-hidden flex flex-col h-[380px] animate-pulse">
      {/* Image Skeleton */}
      <div className="h-48 bg-slate-200 dark:bg-white/5 relative overflow-hidden border-b border-slate-200 dark:border-white/[0.04]">
        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* Info Skeleton */}
      <div className="p-5 flex flex-col flex-grow justify-between">
        <div>
          {/* Category & distance */}
          <div className="flex justify-between items-start mb-2">
            <div className="w-16 h-4 bg-slate-200 dark:bg-white/10 rounded-full" />
            <div className="w-12 h-4 bg-slate-200 dark:bg-white/10 rounded-full" />
          </div>
          {/* Title */}
          <div className="w-3/4 h-6 bg-slate-200 dark:bg-white/10 rounded-lg mb-2" />
          {/* Description lines */}
          <div className="w-full h-4 bg-slate-200 dark:bg-white/5 rounded-lg mb-1.5" />
          <div className="w-2/3 h-4 bg-slate-200 dark:bg-white/5 rounded-lg mb-4" />
        </div>

        <div>
          {/* Price & Seller */}
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/[0.04] pt-4">
            <div>
              <div className="w-16 h-3 bg-slate-200 dark:bg-white/5 rounded mb-1" />
              <div className="w-20 h-6 bg-slate-200 dark:bg-white/10 rounded-lg" />
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <div className="w-24 h-4 bg-slate-200 dark:bg-white/5 rounded-full" />
              <div className="w-16 h-3 bg-slate-200 dark:bg-white/5 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
