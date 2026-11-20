import { cn } from "@/lib/utils";

/** Pulsing "NEW" pill used to highlight recently added features. */
export default function NewBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative ml-0.5 inline-flex items-center rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-1.5 py-px text-[9px] font-bold leading-tight tracking-wide text-slate-900 shadow-[0_0_8px_rgba(251,146,60,0.6)] normal-case",
        className,
      )}
    >
      <span className="absolute inset-0 rounded-full bg-orange-400/60 animate-ping [animation-duration:2s]" aria-hidden />
      <span className="relative">NEW</span>
    </span>
  );
}
