

"use client";
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Loader from '@/components/Loader';
import ErrorState from '@/components/ErrorState';
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { HealthRow } from '@/lib/types';
import Link from 'next/link';
import { toNum, formatNumber } from '@/lib/format';
import { KpiCard } from '@/components/KpiCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Activity, ShieldCheck, Search, BarChart3, TrendingUp, Zap } from 'lucide-react';
import { HealthRiskChart } from '@/components/charts/HealthRiskChart';
import { PerformanceScoreChart } from '@/components/charts/PerformanceScoreChart';
import { useHealthRealTime } from '@/hooks/useRealTimeData';
// import { HealthTrendChart } from '@/components/charts/HealthTrendChart';

export default function HealthPage() {
  // Enable real-time data updates
  useHealthRealTime();

  const { data, isLoading, error, refetch } = useQuery({ 
    queryKey: ['health'], 
    queryFn: api.getHealth, 
    staleTime: 30_000 
  });

  const raw = (data || []) as HealthRow[];
  const rows = raw.slice().sort((a, b) => toNum(b.downtime_risk_pct) - toNum(a.downtime_risk_pct));

  // Calculate comprehensive health metrics
  const metrics = useMemo(() => {
    if (rows.length === 0) return { avgFuel: 0, avgUtil: 0, avgSafety: 0, avgWear: 0, healthScore: 0 };
    
    const totals = rows.reduce((acc, row) => ({
      fuel: acc.fuel + toNum(row.fuel_efficiency_score),
      util: acc.util + toNum(row.utilization_ratio),
      safety: acc.safety + toNum(row.safety_score),
      wear: acc.wear + toNum(row.wear_and_tear_index),
      stability: acc.stability + toNum(row.engine_stability_score)
    }), { fuel: 0, util: 0, safety: 0, wear: 0, stability: 0 });

    const avgFuel = totals.fuel / rows.length;
    const avgUtil = totals.util / rows.length;
    const avgSafety = totals.safety / rows.length;
    const avgWear = totals.wear / rows.length;
    const avgStability = totals.stability / rows.length;

    // Calculate overall fleet health score (higher is better)
    const healthScore = (avgFuel + avgUtil + avgSafety + avgStability + (100 - avgWear)) / 5;

    return { avgFuel, avgUtil, avgSafety, avgWear, healthScore };
  }, [rows]);

  // Risk categorization
  const riskCounts = useMemo(() => {
    return rows.reduce((acc, row) => {
      const risk = toNum(row.downtime_risk_pct);
      if (risk >= 80) acc.critical++;
      else if (risk >= 60) acc.high++;
      else if (risk >= 30) acc.medium++;
      else acc.low++;
      return acc;
    }, { critical: 0, high: 0, medium: 0, low: 0 });
  }, [rows]);

  const riskLevel = (pct: number) => {
    if (pct >= 80) return { label: 'Critical', color: 'bg-red-100 text-red-800 border-red-200' };
    if (pct >= 60) return { label: 'High', color: 'bg-orange-100 text-orange-800 border-orange-200' };
    if (pct >= 30) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    return { label: 'Low', color: 'bg-green-100 text-green-800 border-green-200' };
  };

  // Search and filter state
  const [search, setSearch] = useState('');
  const [risk, setRisk] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const matchesSearch = [r.name, r.manufacturer].some((v) => v.toLowerCase().includes(search.toLowerCase()));
      const pct = toNum(r.downtime_risk_pct);
      const level = pct >= 80 ? 'critical' : pct >= 60 ? 'high' : pct >= 30 ? 'medium' : 'low';
      const matchesRisk = risk === 'all' || level === risk;
      return matchesSearch && matchesRisk;
    });
  }, [rows, search, risk]);

  const columns: ColumnDef<HealthRow>[] = useMemo(() => [
    {
      header: 'Machine',
      cell: ({ row }) => (
        <Link href={`/health/${row.original.machine_id}`} className="font-medium hover:text-blue-600 transition-colors">
          {row.original.name}
        </Link>
      ),
    },
    { 
      header: 'Manufacturer', 
      accessorKey: 'manufacturer',
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.manufacturer}</span>
      )
    },
    { 
      header: 'Fuel Efficiency', 
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span>{formatNumber(row.original.fuel_efficiency_score, 1)}%</span>
          {toNum(row.original.fuel_efficiency_score) >= 80 && <Zap className="h-3 w-3 text-green-500" />}
        </div>
      )
    },
    { 
      header: 'Safety Score', 
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span>{formatNumber(row.original.safety_score, 0)}</span>
          {toNum(row.original.safety_score) >= 80 && <ShieldCheck className="h-3 w-3 text-green-500" />}
        </div>
      )
    },
    { 
      header: 'Utilization', 
      cell: ({ row }) => `${formatNumber(row.original.utilization_ratio, 0)}%`
    },
    { 
      header: 'Wear Level', 
      cell: ({ row }) => {
        const wear = toNum(row.original.wear_and_tear_index);
        return (
          <div className="flex items-center gap-2">
            <span>{formatNumber(wear, 0)}</span>
            {wear >= 80 && <AlertTriangle className="h-3 w-3 text-red-500" />}
          </div>
        );
      }
    },
    {
      header: 'Risk Level',
      cell: ({ row }) => {
        const pct = toNum(row.original.downtime_risk_pct);
        const r = riskLevel(pct);
        return (
          <div className="flex items-center gap-2">
            <Badge className={`${r.color} border`}>{r.label}</Badge>
            <span className="text-xs text-muted-foreground">{formatNumber(pct, 0)}%</span>
          </div>
        );
      },
    },
  ], []);

  if (isLoading) return <Loader />;
  if (error) return <ErrorState error={error} retry={refetch} />;

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          Fleet Health Analytics
        </h1>
        <p className="text-muted-foreground text-lg">
          Advanced health monitoring, risk assessment, and performance insights
        </p>
      </div>

      {/* Enhanced KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <KpiCard 
          title="Fleet Health Score" 
          value={`${formatNumber(metrics.healthScore, 0)}%`} 
          sub="Overall fleet health" 
        />
        <KpiCard 
          title="Critical Risk" 
          value={riskCounts.critical.toString()} 
          sub="≥ 80% downtime risk" 
        />
        <KpiCard 
          title="Avg Efficiency" 
          value={`${formatNumber(metrics.avgFuel, 0)}%`} 
          sub="Fuel performance" 
        />
        <KpiCard 
          title="Safety Average" 
          value={`${formatNumber(metrics.avgSafety, 0)}`} 
          sub="Fleet safety score" 
        />
        <KpiCard 
          title="Total Monitored" 
          value={rows.length.toString()} 
          sub="Active machines" 
        />
      </div>

      {/* Advanced Health Charts */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-green-600" />
          <h2 className="text-xl font-semibold">Health Analytics Dashboard</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <HealthRiskChart data={rows} />
          <PerformanceScoreChart data={rows} />
        </div>
      </div>

      {/* Machine Health Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                Machine Health Details
              </CardTitle>
              <CardDescription>
                Detailed health metrics with advanced filtering and search
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search machines..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <select
                value={risk}
                onChange={(e) => setRisk(e.target.value as any)}
                className="px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Risk Levels</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={filteredRows} />
          
          {/* Table Summary */}
          <div className="flex items-center justify-between pt-4 text-sm text-gray-500 border-t">
            <span>
              Showing {filteredRows.length} of {rows.length} machines
            </span>
            <div className="flex gap-4">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Low Risk: {riskCounts.low}
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                Medium: {riskCounts.medium}
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                High: {riskCounts.high}
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                Critical: {riskCounts.critical}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}