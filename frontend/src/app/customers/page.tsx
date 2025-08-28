"use client";
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Loader from '@/components/Loader';
import ErrorState from '@/components/ErrorState';
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { CustomerRow } from '@/lib/types';
import { toNum } from '@/lib/format';
import { Badge } from '@/components/ui/badge';

export default function CustomersPage() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['customers'], queryFn: api.getCustomers, staleTime: 30_000 });
  const [industryFilter, setIndustryFilter] = useState<string>('All');
  const [stateFilter, setStateFilter] = useState<string>('All');
  const [partnerOnly, setPartnerOnly] = useState<boolean>(false);

  const enriched: (CustomerRow & { sustainability_score: number; onTimeReturnRate: number; avgWearIndex: number })[] = (data || []).map((c) => ({
    ...c,
    sustainability_score: toNum(c.sustainability_score),
    onTimeReturnRate: toNum(c.onTimeReturnRate),
    avgWearIndex: toNum(c.avgWearIndex),
  }));

  const isPartner = (c: CustomerRow & { sustainability_score: number; onTimeReturnRate: number }) => c.sustainability_score >= 75 && c.onTimeReturnRate >= 90;
  const isRisky = (c: CustomerRow & { avgWearIndex: number; onTimeReturnRate: number }) => c.avgWearIndex >= 65 || c.onTimeReturnRate <= 70;

  const filtered = enriched.filter(c =>
    (industryFilter === 'All' || c.industry === industryFilter) &&
    (stateFilter === 'All' || c.state === stateFilter) &&
    (!partnerOnly || isPartner(c))
  );

  const columns: ColumnDef<(typeof enriched)[number]>[] = useMemo(() => [
    { header: 'Company', accessorKey: 'name' },
    { header: 'Industry', accessorKey: 'industry' },
    { header: 'State', accessorKey: 'state' },
    { header: 'Segment', accessorKey: 'segment' },
    { header: 'Sustainability', accessorKey: 'sustainability_score' },
    { header: 'Total Rentals', accessorKey: 'totalRentals' },
    { header: 'On-Time %', accessorKey: 'onTimeReturnRate' },
    { header: 'Avg Safety', accessorKey: 'avgSafetyScore' },
    { header: 'Avg Wear', accessorKey: 'avgWearIndex' },
    { header: 'Badges', cell: ({ row }) => (
      <div className="flex gap-2">
        {isPartner(row.original) && <Badge variant="secondary">Green Partner</Badge>}
        {isRisky(row.original) && <Badge variant="destructive">Risky</Badge>}
      </div>
    ) },
  ], [/* no deps */]);

  const industries = Array.from(new Set(enriched.map(c => c.industry)));
  const states = Array.from(new Set(enriched.map(c => c.state)));

  return (
    <div className="space-y-4">
      {isLoading && <Loader/>}
      {error && <ErrorState error={error} retry={refetch}/>}      
      <div className="flex gap-4 items-center text-sm">
        <label className="flex items-center gap-2">Industry
          <select className="border px-2 py-1 rounded" value={industryFilter} onChange={(e)=>setIndustryFilter(e.target.value)}>
            <option>All</option>
            {industries.map(i => <option key={i}>{i}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2">State
          <select className="border px-2 py-1 rounded" value={stateFilter} onChange={(e)=>setStateFilter(e.target.value)}>
            <option>All</option>
            {states.map(s => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={partnerOnly} onChange={(e)=>setPartnerOnly(e.target.checked)} /> Partner only
        </label>
      </div>
      <DataTable columns={columns} data={filtered} />
    </div>
  );
}


