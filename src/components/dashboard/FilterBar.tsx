import { companies, statusOptions, channelOptions, categoryOptions } from "@/data/mockData";

interface FilterBarProps {
  company: string;
  branch: string;
  status: string;
  channel: string;
  category: string;
  onCompanyChange: (v: string) => void;
  onBranchChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onChannelChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
}

export default function FilterBar({
  company, branch, status, channel, category,
  onCompanyChange, onBranchChange, onStatusChange, onChannelChange, onCategoryChange
}: FilterBarProps) {
  const currentCompany = companies.find(c => c.id === company);

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-card rounded-xl border border-border">
      <span className="text-sm font-semibold text-muted-foreground">Filter:</span>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">บริษัท</label>
        <select className="filter-select" value={company} onChange={e => { onCompanyChange(e.target.value); onBranchChange("ALL"); }}>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">สาขา</label>
        <select className="filter-select" value={branch} onChange={e => onBranchChange(e.target.value)}>
          {currentCompany?.branches.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Status</label>
        <select className="filter-select" value={status} onChange={e => onStatusChange(e.target.value)}>
          <option value="ALL">ALL</option>
          {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">ช่องทางการแจ้ง</label>
        <select className="filter-select" value={channel} onChange={e => onChannelChange(e.target.value)}>
          {channelOptions.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">หมวดหมู่</label>
        <select className="filter-select" value={category} onChange={e => onCategoryChange(e.target.value)}>
          {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
    </div>
  );
}
