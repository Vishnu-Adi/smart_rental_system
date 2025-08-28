"use client";
import { useEffect, useMemo, useState } from 'react';
import { Search, Download, AlertTriangle, CheckCircle } from 'lucide-react';
import { UsageRow } from '@/lib/types';
import { useAnomalyCheck } from '@/hooks/useAnomalyCheck';

interface RawMetricsTableProps {
  data: UsageRow[];
}

export function RawMetricsTable({ data }: RawMetricsTableProps) {
  const [search, setSearch] = useState('');
  
  // Filters & pagination
  const [statusFilter, setStatusFilter] = useState<'all' | 'Normal' | 'Underutilized' | 'Overutilized'>('all');
  const [anomalyFilter, setAnomalyFilter] = useState<'all' | 'anomaly' | 'normal' | 'error' | 'unchecked'>('all');
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Helper for robust formatting
  const fmt = (value: unknown, digits = 0, suffix = ''): string => {
    const num = Number(value);
    if (Number.isNaN(num)) return '—';
    return `${digits > 0 ? num.toFixed(digits) : Math.round(num)}` + suffix;
  };

  // Reset to first page when filters/search/page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, anomalyFilter, pageSize]);
  
  const baseFilteredData = useMemo(() => data.filter(row => {
    const matchesSearch = search === '' || 
      (row.name && row.name.toLowerCase().includes(search.toLowerCase())) ||
      (row.machine_id && row.machine_id.toString().includes(search));
    if (!matchesSearch) return false;
    const matchesStatus = statusFilter === 'all' || (row.utilization_status === statusFilter);
    return matchesStatus;
  }), [data, search, statusFilter]);

  const [totalPages, pageStart] = useMemo(() => {
    const pages = Math.max(1, Math.ceil(baseFilteredData.length / pageSize));
    const start = (currentPage - 1) * pageSize;
    return [pages, start] as const;
  }, [baseFilteredData, pageSize, currentPage]);

  const visibleRows = useMemo(() => baseFilteredData.slice(pageStart, pageStart + pageSize), [baseFilteredData, pageStart, pageSize]);
  
  const anomalyMap = useAnomalyCheck(visibleRows);

  const filteredData = useMemo(() => {
    if (anomalyFilter === 'all') return baseFilteredData;
    return baseFilteredData.filter(row => {
      const state = anomalyMap[Number(row.machine_id)];
      if (anomalyFilter === 'anomaly' && !state?.isAnomaly) return false;
      if (anomalyFilter === 'normal' && state?.isAnomaly !== false) return false;
      if (anomalyFilter === 'error' && !state?.error) return false;
      if (anomalyFilter === 'unchecked' && (state?.isAnomaly !== undefined || state?.loading)) return false;
      return true;
    });
  }, [baseFilteredData, anomalyFilter, anomalyMap]);
  
  const paginatedRows = useMemo(() => filteredData.slice(pageStart, pageStart + pageSize), [filteredData, pageStart, pageSize]);

  const exportToCSV = () => {
    const headers = [
      'Machine ID', 'Name', 'Status', 'Fuel Rate (L/hr)', 'Idle Fuel %', 'RPM Variance', 'Coolant Anom',
      'Productive Time', 'Idle Time', 'Vibration', 'Overload', 'Overspeed', 'Tire Pressure', 
      'Error Frequency', 'Battery Events', 'Anomaly', 'Anomaly Score'
    ];
    
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => {
        const state = anomalyMap[Number(row.machine_id)];
        return [
          row.machine_id || '',
          row.name || '',
          row.utilization_status || '',
          Number(row.avg_fuel_consumption_rate ?? 0).toFixed(1),
          Number(row.idle_fuel_consumption_pct ?? 0).toFixed(1),
          Number(row.rpm_variance ?? 0),
          Number(row.coolant_temp_anomalies ?? 0),
          Number(row.productive_time_mins ?? 0),
          Number(row.idle_time_mins ?? 0),
          Number(row.vibration_anomalies ?? 0),
          Number(row.overload_cycles ?? 0),
          Number(row.over_speed_events ?? 0),
          Number(row.tire_pressure_deviations ?? 0),
          Number(row.error_code_frequency ?? 0),
          Number(row.battery_low_voltage_events ?? 0),
          state?.isAnomaly === true ? 'Anomaly' : state?.isAnomaly === false ? 'Normal' : 'Unknown',
          typeof state?.score === 'number' ? state.score.toFixed(4) : ''
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'raw_metrics_data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Raw Metrics Analytics</h3>
        <button
          onClick={exportToCSV}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Controls */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search machines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="Normal">Normal</option>
          <option value="Underutilized">Underutilized</option>
          <option value="Overutilized">Overutilized</option>
        </select>
        <select
          value={anomalyFilter}
          onChange={(e) => setAnomalyFilter(e.target.value as any)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All (Anomaly)</option>
          <option value="anomaly">Anomaly</option>
          <option value="normal">Normal</option>
          <option value="error">Error</option>
          <option value="unchecked">Unchecked</option>
        </select>
        <div className="flex items-center gap-2">
          <label className="text-gray-400 text-sm">Rows:</label>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <div className="max-h-[60vh] overflow-y-auto rounded-lg">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur border-b border-gray-700">
              <tr>
                <th className="text-left p-3 text-gray-300">Machine</th>
                <th className="text-left p-3 text-gray-300">Status</th>
                <th className="text-left p-3 text-blue-300">Fuel Rate</th>
                <th className="text-left p-3 text-blue-300">Idle %</th>
                <th className="text-left p-3 text-green-300">RPM</th>
                <th className="text-left p-3 text-green-300">Coolant</th>
                <th className="text-left p-3 text-purple-300">Prod Time</th>
                <th className="text-left p-3 text-purple-300">Idle Time</th>
                <th className="text-left p-3 text-orange-300">Vibration</th>
                <th className="text-left p-3 text-orange-300">Overload</th>
                <th className="text-left p-3 text-red-300">Speed</th>
                <th className="text-left p-3 text-red-300">Pressure</th>
                <th className="text-left p-3 text-yellow-300">Errors</th>
                <th className="text-left p-3 text-yellow-300">Battery</th>
                <th className="text-left p-3 text-pink-300">Anomaly</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, index) => (
                <tr key={`${row.machine_id}-${index}`} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                  <td className="p-3">
                    <div className="text-white font-medium">#{row.machine_id}</div>
                    <div className="text-xs text-gray-400">{row.name}</div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      row.utilization_status === 'Normal' ? 'bg-green-900 text-green-200' :
                      row.utilization_status === 'Underutilized' ? 'bg-yellow-900 text-yellow-200' :
                      row.utilization_status === 'Overutilized' ? 'bg-red-900 text-red-200' :
                      'bg-gray-800 text-gray-400'
                    }`}>
                      {row.utilization_status || 'N/A'}
                    </span>
                  </td>
                  <td className="p-3 text-blue-300">{fmt(row.avg_fuel_consumption_rate, 1)}</td>
                  <td className="p-3 text-blue-300">{fmt(row.idle_fuel_consumption_pct, 1, '%')}</td>
                  <td className="p-3 text-green-300">{fmt(row.rpm_variance)}</td>
                  <td className="p-3 text-green-300">{fmt(row.coolant_temp_anomalies)}</td>
                  <td className="p-3 text-purple-300">{fmt(row.productive_time_mins, 0, 'm')}</td>
                  <td className="p-3 text-purple-300">{fmt(row.idle_time_mins, 0, 'm')}</td>
                  <td className="p-3 text-orange-300">{fmt(row.vibration_anomalies)}</td>
                  <td className="p-3 text-orange-300">{fmt(row.overload_cycles)}</td>
                  <td className="p-3 text-red-300">{fmt(row.over_speed_events)}</td>
                  <td className="p-3 text-red-300">{fmt(row.tire_pressure_deviations)}</td>
                  <td className="p-3 text-yellow-300">{fmt(row.error_code_frequency)}</td>
                  <td className="p-3 text-yellow-300">{fmt(row.battery_low_voltage_events)}</td>
                  <td className="p-3">
                    {(() => {
                      const state = anomalyMap[Number(row.machine_id)];
                      if (!state || state.loading) {
                        return <span className="text-xs text-gray-400">Checking…</span>;
                      }
                      if (state.error) {
                        return <span className="text-xs text-red-300">Error</span>;
                      }
                      if (state.isAnomaly) {
                        return (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-900 text-red-200">
                            <AlertTriangle className="h-3 w-3" /> Anomaly{typeof state.score === 'number' ? ` (${state.score.toFixed(2)})` : ''}
                          </span>
                        );
                      }
                      if (state.isAnomaly === false) {
                        return (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-900 text-green-200">
                            <CheckCircle className="h-3 w-3" /> Normal{typeof state.score === 'number' ? ` (${state.score.toFixed(2)})` : ''}
                          </span>
                        );
                      }
                      return <span className="text-xs text-gray-400">—</span>;
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-300">
        <div>
          Page {currentPage} of {totalPages} • Showing {paginatedRows.length} of {filteredData.length} filtered
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded bg-gray-800 border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 rounded bg-gray-800 border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}