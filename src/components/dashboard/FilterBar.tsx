import { Filter, CalendarIcon, X } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  companies: { id: string; name: string }[];
  branches: { id: string; name: string; company_id: string }[];
  statuses: string[];
  categories: { id: string; name: string }[];
  companyId: string;
  branchId: string;
  status: string;
  category: string;
  dateFrom: string;
  dateTo: string;
  onCompanyChange: (v: string) => void;
  onBranchChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  companyDisabled?: boolean;
  branchDisabled?: boolean;
  onReset?: () => void;
}

function DatePicker({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(value) : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "filter-select h-9 w-36 justify-start text-left font-normal px-3 gap-2 bg-transparent border-white/10 hover:bg-white/5",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="h-3.5 w-3.5 shrink-0 opacity-60" />
            <span className="text-xs truncate">
              {selected ? format(selected, "d MMM yyyy", { locale: th }) : placeholder}
            </span>
            {value && (
              <X
                className="h-3 w-3 ml-auto shrink-0 opacity-50 hover:opacity-100"
                onClick={e => { e.stopPropagation(); onChange(""); }}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={date => {
              onChange(date ? format(date, "yyyy-MM-dd") : "");
              setOpen(false);
            }}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default function FilterBar({
  companies, branches, statuses, categories,
  companyId, branchId, status, category, dateFrom, dateTo,
  onCompanyChange, onBranchChange, onStatusChange, onCategoryChange,
  onDateFromChange, onDateToChange,
  companyDisabled, branchDisabled, onReset,
}: FilterBarProps) {
  const hasActiveFilter = (
    (!companyDisabled && companyId !== "ALL") ||
    (!branchDisabled && branchId !== "ALL") ||
    status !== "ALL" ||
    category !== "ALL" ||
    !!dateFrom ||
    !!dateTo
  );

  return (
    <div className="glass rounded-2xl p-4 mb-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex items-center gap-2 text-muted-foreground mr-1">
          <Filter className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Filters</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">บริษัท</label>
          <select className="filter-select" value={companyId} onChange={e => onCompanyChange(e.target.value)} disabled={companyDisabled}>
            <option value="ALL">ทั้งหมด</option>
            {(companies || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">สาขา</label>
          <select className="filter-select" value={branchId} onChange={e => onBranchChange(e.target.value)} disabled={branchDisabled}>
            <option value="ALL">ทั้งหมด</option>
            {(branches || []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">สถานะ</label>
          <select className="filter-select" value={status} onChange={e => onStatusChange(e.target.value)}>
            <option value="ALL">ทั้งหมด</option>
            {(statuses || []).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">หมวดหมู่</label>
          <select className="filter-select" value={category} onChange={e => onCategoryChange(e.target.value)}>
            <option value="ALL">ทั้งหมด</option>
            {(categories || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <DatePicker label="ตั้งแต่" value={dateFrom} onChange={onDateFromChange} placeholder="เลือกวันเริ่ม" />
        <DatePicker label="ถึงวันที่" value={dateTo} onChange={onDateToChange} placeholder="เลือกวันสิ้นสุด" />

        {onReset && hasActiveFilter && (
          <div className="flex flex-col justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-white/10"
            >
              <X className="h-3.5 w-3.5" />
              รีเซ็ต
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
