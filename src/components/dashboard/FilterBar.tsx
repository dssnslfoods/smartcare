import { Filter } from "lucide-react";

interface FilterBarProps {
  companies: { id: string; name: string }[];
  branches: { id: string; name: string; company_id: string }[];
  statuses: string[];
  categories: string[];
  companyId: string;
  branchId: string;
  status: string;
  category: string;
  onCompanyChange: (v: string) => void;
  onBranchChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
}

export default function FilterBar({
  companies, branches, statuses, categories,
  companyId, branchId, status, category,
  onCompanyChange, onBranchChange, onStatusChange, onCategoryChange
}: FilterBarProps) {
  return (
    <div className="glass rounded-2xl p-4 mb-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex items-center gap-2 text-muted-foreground mr-1">
          <Filter className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Filters</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">บริษัท</label>
          <select className="filter-select" value={companyId} onChange={e => onCompanyChange(e.target.value)}>
            <option value="ALL">ทั้งหมด</option>
            {(companies || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">สาขา</label>
          <select className="filter-select" value={branchId} onChange={e => onBranchChange(e.target.value)}>
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
            {(categories || []).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
