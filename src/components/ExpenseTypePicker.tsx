import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseKeywords } from "@/lib/expenseTypeGuess";

export interface ExpenseTypeOption {
  id: string;
  name: string;
  keywords?: string | null;
}

interface Props {
  types: ExpenseTypeOption[];
  value: string;
  isAuto: boolean;
  invalid?: boolean;
  /** detail has text but no keyword matched */
  noMatch?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (id: string) => void;
}

const SEARCH_THRESHOLD = 8;

/**
 * Single-choice expense type picker: a summary chip that expands inline
 * into a radio group of pills (no popover).
 */
export default function ExpenseTypePicker({ types, value, isAuto, invalid, noMatch, open, onOpenChange, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const chipRef = useRef<HTMLButtonElement>(null);
  const pillRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const selected = types.find(t => t.id === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = types;
    if (q) {
      list = types.filter(t =>
        t.name.toLowerCase().includes(q) || parseKeywords(t.keywords).some(k => k.includes(q)));
    }
    // current pick first so it's always visible
    return value ? [...list.filter(t => t.id === value), ...list.filter(t => t.id !== value)] : list;
  }, [types, query, value]);

  const showSearch = types.length > SEARCH_THRESHOLD;

  useEffect(() => { if (!open) setQuery(""); }, [open]);

  function focusPill(i: number) {
    const n = filtered.length;
    if (!n) return;
    pillRefs.current[((i % n) + n) % n]?.focus();
  }

  function close() {
    onOpenChange(false);
    chipRef.current?.focus();
  }

  function onPillKey(e: React.KeyboardEvent, i: number) {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); focusPill(i + 1); }
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); focusPill(i - 1); }
    else if (e.key === "Home") { e.preventDefault(); focusPill(0); }
    else if (e.key === "End") { e.preventDefault(); focusPill(filtered.length - 1); }
    else if (e.key === "Escape") { e.preventDefault(); close(); }
  }

  const activeIdx = Math.max(0, filtered.findIndex(t => t.id === value));

  let chipClass = "border-dashed border-border/60 text-muted-foreground hover:border-primary/50";
  let chipContent: React.ReactNode = "เลือกประเภท";
  if (selected && isAuto) {
    chipClass = "border-primary/40 bg-primary/10 text-primary";
    chipContent = <><Sparkles className="h-3.5 w-3.5" />{selected.name}</>;
  } else if (selected) {
    chipClass = "border-primary/50 bg-primary/15 text-foreground";
    chipContent = selected.name;
  }
  if (invalid && !selected) chipClass = "border-destructive text-destructive border-solid";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">ประเภท <span className="text-destructive">*</span></span>
        <button
          ref={chipRef}
          type="button"
          aria-expanded={open}
          aria-haspopup="true"
          title={selected && isAuto ? "ระบบเลือกจากคีย์เวิร์ด — กดเพื่อเปลี่ยน" : undefined}
          onClick={() => onOpenChange(!open)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 min-h-9 sm:min-h-8 text-sm transition-colors",
            chipClass,
          )}
        >
          {chipContent}
          <ChevronDown className={cn("h-3.5 w-3.5 opacity-70 transition-transform", open && "rotate-180")} />
        </button>
        {open && (
          <span className="text-xs text-muted-foreground">
            {noMatch && !selected ? "ไม่พบประเภทที่ตรง — เลือกเอง" : "เลือก 1 ประเภท"}
          </span>
        )}
      </div>
      {invalid && !selected && !open && (
        <p className="text-xs text-destructive">กรุณาเลือกประเภทค่าใช้จ่าย</p>
      )}

      {open && (
        <div className="space-y-2">
          {showSearch && (
            <div className="relative max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Escape") { e.preventDefault(); close(); }
                  if (e.key === "ArrowDown") { e.preventDefault(); focusPill(0); }
                }}
                placeholder="ค้นหาประเภท..."
                className="w-full h-8 rounded-md border border-border/50 bg-background pl-8 pr-2 text-sm outline-none focus:border-primary/60"
              />
            </div>
          )}
          <div
            role="radiogroup"
            aria-label="ประเภทค่าใช้จ่าย"
            className={cn("flex flex-wrap gap-2", types.length > 15 && "max-h-40 overflow-y-auto pr-1")}
          >
            {filtered.length === 0 && <span className="text-xs text-muted-foreground">ไม่พบประเภท</span>}
            {filtered.map((t, i) => {
              const isSel = t.id === value;
              return (
                <button
                  key={t.id}
                  ref={el => { pillRefs.current[i] = el; }}
                  type="button"
                  role="radio"
                  aria-checked={isSel}
                  tabIndex={i === activeIdx ? 0 : -1}
                  onKeyDown={e => onPillKey(e, i)}
                  onClick={() => { onSelect(t.id); close(); }}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg border px-3.5 min-h-11 sm:min-h-9 text-sm transition-all",
                    isSel
                      ? "bg-primary/15 border-primary/50 text-foreground font-medium"
                      : "border-border/40 bg-background hover:border-primary/40",
                  )}
                >
                  <span className={cn(
                    "h-3.5 w-3.5 rounded-full border flex items-center justify-center",
                    isSel ? "border-primary" : "border-input",
                  )}>
                    {isSel && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  </span>
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
