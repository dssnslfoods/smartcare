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
    <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-card rounded-xl border border-border">
      <span className="text-sm font-semibold text-muted-foreground">Filter:</span>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">บริษัท</label>
        <select className="filter-select" value={companyId} onChange={e => onCompanyChange(e.target.value)}>
          <option value="ALL">ทั้งหมด</option>
          {(companies || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">สาขา</label>
        <select className="filter-select" value={branchId} onChange={e => onBranchChange(e.target.value)}>
          <option value="ALL">ทั้งหมด</option>
          {(branches || []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Status</label>
        <select className="filter-select" value={status} onChange={e => onStatusChange(e.target.value)}>
          <option value="ALL">ทั้งหมด</option>
          {(statuses || []).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">หมวดหมู่</label>
        <select className="filter-select" value={category} onChange={e => onCategoryChange(e.target.value)}>
          <option value="ALL">ทั้งหมด</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
    </div>
  );
}
