"use client";
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Loader from '@/components/Loader';
import ErrorState from '@/components/ErrorState';
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { AssetRow } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { formatMoney, toNum } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkline } from '@/components/Sparkline';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AssetsPage() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['assets'], queryFn: api.getAssets, staleTime: 30_000 });
  const [selected, setSelected] = useState<AssetRow | null>(null);

  const columns: ColumnDef<AssetRow>[] = useMemo(() => [
    { header: 'ID', accessorKey: 'machine_id' },
    { header: 'Type', accessorKey: 'asset_type' },
    { header: 'Manufacturer', accessorKey: 'manufacturer' },
    { header: 'YOM', accessorKey: 'year_of_manufacture' },
    { header: 'Status', cell: ({ row }) => <Badge className="capitalize">{row.original.status.replace('_',' ')}</Badge> },
    { header: 'RentalStatus', accessorKey: 'rentalStatus' },
    { header: 'Current Renter', accessorKey: 'currentRenter' },
    { header: 'Hourly Rate', cell: ({ row }) => formatMoney(row.original.rental_price_per_hour) },
    { header: 'Day Rate', cell: ({ row }) => formatMoney(row.original.rental_price_per_day) },
    { header: 'Location', cell: ({ row }) => `${toNum(row.original.current_location_lat).toFixed(4)}, ${toNum(row.original.current_location_lon).toFixed(4)}` },
  ], []);

  if (isLoading) return <Loader/>;
  if (error) return <ErrorState error={error} retry={refetch}/>;
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
      <div>
        <DataTable columns={columns} data={data.assets} onRowClick={(row) => setSelected(row as AssetRow)} />
      </div>
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Selected Machine</CardTitle>
          </CardHeader>
          <CardContent>
            {!selected && <div className="text-xs text-muted-foreground">Select a row to see details.</div>}
            {selected && <SelectedPanel asset={selected} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SelectedPanel({ asset }: { asset: AssetRow }) {
  const { data } = useQuery({ queryKey: ['machine', asset.machine_id], queryFn: () => api.getMachineDetail(asset.machine_id), staleTime: 30_000, enabled: !!asset });
  if (!asset) return null;
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">{asset.asset_type} #{asset.machine_id}</div>
      <div className="text-xs text-muted-foreground">{asset.manufacturer} • {asset.year_of_manufacture}</div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-xs mb-1">Productive mins</div>
          <Sparkline data={data?.sensorReadings || []} dataKey="productive_time_mins" color="#22c55e" />
        </div>
        <div>
          <div className="text-xs mb-1">Idle mins</div>
          <Sparkline data={data?.sensorReadings || []} dataKey="idle_time_mins" color="#f59e0b" />
        </div>
      </div>
      <div className="flex gap-2">
        <Link href={`/health/${asset.machine_id}`}><Button size="sm" variant="outline">View health</Button></Link>
        <Link href={`/usage`}><Button size="sm" variant="outline">Usage</Button></Link>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" disabled title="Backend action endpoint not available yet">Check-out</Button>
        <Button size="sm" variant="secondary" disabled title="Backend action endpoint not available yet">Check-in</Button>
      </div>
    </div>
  );
}


