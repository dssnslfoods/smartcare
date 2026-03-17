import { Volume2, VolumeX } from "lucide-react";
import type { TTSStatus } from "@/hooks/useTTS";

interface Props {
  status: TTSStatus;
  supported: boolean;
  onPlay: () => void;
  onPause: () => void;
  onCancel: () => void;
}

export default function TTSButton({ status, supported, onPlay, onPause, onCancel }: Props) {
  if (!supported) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Play / Pause / Resume */}
      <button
        onClick={() => (status === "playing" ? onPause() : onPlay())}
        title={
          status === "playing"
            ? "หยุดชั่วคราว"
            : status === "paused"
            ? "เล่นต่อ"
            : "ฟังสรุป Executive Summary"
        }
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border
          ${
            status === "playing"
              ? "bg-amber-500/20 border-amber-500/50 text-amber-400 hover:bg-amber-500/30"
              : status === "paused"
              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30"
              : "bg-sky-500/15 border-sky-500/35 text-sky-400 hover:bg-sky-500/25"
          }`}
      >
        {status === "playing" ? (
          <>
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
              <rect x="3" y="2" width="3.5" height="12" rx="1" />
              <rect x="9.5" y="2" width="3.5" height="12" rx="1" />
            </svg>
            <span>หยุดชั่วคราว</span>
            <span className="flex gap-0.5 items-end h-3.5 ml-0.5">
              {[0, 150, 300].map(d => (
                <span
                  key={d}
                  className="w-0.5 bg-amber-400 rounded-full animate-bounce"
                  style={{ height: "60%", animationDelay: `${d}ms` }}
                />
              ))}
            </span>
          </>
        ) : status === "paused" ? (
          <>
            <Volume2 className="w-3.5 h-3.5 shrink-0" />
            <span>เล่นต่อ</span>
          </>
        ) : (
          <>
            <Volume2 className="w-3.5 h-3.5 shrink-0" />
            <span>ฟังสรุป</span>
          </>
        )}
      </button>

      {/* Stop — only when active */}
      {status !== "idle" && (
        <button
          onClick={onCancel}
          title="หยุดและเริ่มใหม่"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border
            bg-rose-500/15 border-rose-500/35 text-rose-400 hover:bg-rose-500/25 transition-all duration-200"
        >
          <VolumeX className="w-3.5 h-3.5" />
          <span>หยุด</span>
        </button>
      )}
    </div>
  );
}
