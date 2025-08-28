"use client";
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Loader from '@/components/Loader';
import ErrorState from '@/components/ErrorState';
import { RuntimeChart } from '@/components/charts/RuntimeChart';
import { FuelAnalysisChart } from '@/components/charts/FuelAnalysisChart';
import { DailyUsageTrendChart } from '@/components/charts/DailyUsageTrendChart';
import { SiteUsageChart } from '@/components/charts/SiteUsageChart';
import { Clock, Fuel, MapPin, Activity, TrendingUp, AlertTriangle } from 'lucide-react';
import dynamic from 'next/dynamic';
import { RawMetricsTable } from '@/components/RawMetricsTable';
import { useUsageRealTime } from '@/hooks/useRealTimeData';
import { RealTimeIndicator } from '@/components/RealTimeIndicator';

// Dynamic import for map to avoid SSR issues
const UsageMap = dynamic(() => import('@/components/UsageMap').then(mod => ({ default: mod.UsageMap })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
      <div className="text-gray-500">Loading interactive map...</div>
    </div>
  )
});

export default function UsagePage() {
  // Enable real-time data updates
  useUsageRealTime();

  const { 
    data: analytics, 
    isLoading: analyticsLoading, 
    error: analyticsError 
  } = useQuery({
    queryKey: ['usageAnalytics'],
    queryFn: api.getUsageAnalytics
  });

  const { 
    data: usageData, 
    isLoading: usageLoading, 
    error: usageError 
  } = useQuery({
    queryKey: ['usage'],
    queryFn: api.getUsage
  });

  if (analyticsLoading || usageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Loader />
      </div>
    );
  }

  if (analyticsError || usageError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <ErrorState error="Failed to load usage analytics data" />
      </div>
    );
  }

  // Process usage data for map
  const mapData = usageData
    ?.filter(row => 
      row.location_lat && 
      row.location_lon && 
      Number(row.location_lat) !== 99.99999999 && 
      Number(row.location_lon) !== 99.99999999
    )
    .map(row => {
      const productiveMins = Number(row.productive_time_mins) || 0;
      const idleMins = Number(row.idle_time_mins) || 0;
      const totalMins = productiveMins + idleMins;
      
      return {
        ...row,
        location_lat: Number(row.location_lat),
        location_lon: Number(row.location_lon),
        idlePct: totalMins > 0 ? (idleMins / totalMins) * 100 : 0
      };
    }) || [];

  // Calculate key metrics
  const totalRentalHours = Number(analytics?.rental?.total_rental_hours) || 0;
  const totalRuntimeHours = Number(analytics?.runtime?.total_runtime_hours) || 0;
  const utilizationRate = totalRentalHours > 0 ? (totalRuntimeHours / totalRentalHours) * 100 : 0;
  const downTimeIncidents = Number(analytics?.downtime?.total_incidents) || 0;
  const avgFuelRate = Number(analytics?.runtime?.avg_fuel_rate) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <div className="bg-black border-b border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Usage Analytics
              </h1>
              <p className="mt-2 text-gray-300">
                Runtime tracking, fuel consumption, and operational insights
              </p>
            </div>
            <div className="flex items-center space-x-6">
              <RealTimeIndicator intervalMs={30000} />
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {Number(analytics?.runtime?.active_machines) || 0}
                </div>
                <div className="text-sm text-gray-400">Active Machines</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-900/50 rounded-lg">
                <Clock className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-white">
                  {totalRuntimeHours.toFixed(0)}h
                </div>
                <div className="text-sm text-gray-300">Total Runtime</div>
                <div className="text-xs text-green-400 mt-1">
                  {Number(analytics?.rental?.active_contracts) || 0} active contracts
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-900/50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-white">
                  {utilizationRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-300">Utilization Rate</div>
                <div className="text-xs text-blue-400 mt-1">
                  Runtime vs Rental Hours
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-900/50 rounded-lg">
                <Fuel className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-white">
                  {avgFuelRate.toFixed(1)}
                </div>
                <div className="text-sm text-gray-300">Avg Fuel Rate</div>
                <div className="text-xs text-purple-400 mt-1">
                  Liters per hour
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-orange-900/50 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-orange-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-white">
                  {downTimeIncidents}
                </div>
                <div className="text-sm text-gray-300">Downtime Events</div>
                <div className="text-xs text-orange-400 mt-1">
                  Total incidents logged
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          {/* Runtime Analysis */}
          <RuntimeChart data={analytics?.runtime || {
            total_runtime_hours: 0,
            total_productive_hours: 0,
            total_idle_hours: 0,
            avg_fuel_rate: 0,
            active_machines: 0
          }} />

          {/* Fuel Analysis */}
          <FuelAnalysisChart data={analytics?.fuelByType || []} />
        </div>

        {/* Daily Trends - Full Width */}
        <div className="mb-6">
          <DailyUsageTrendChart data={analytics?.dailyTrends || []} />
        </div>

        {/* Site Usage and Map */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          {/* Site Usage Chart */}
          <div className="xl:col-span-2">
            <SiteUsageChart data={analytics?.siteUsage || []} />
          </div>

          {/* Interactive Map */}
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-blue-400" />
                Live Equipment Map
              </h3>
              <div className="text-sm text-gray-400">
                {mapData.length} machines
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex items-center space-x-4 mb-4 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                <span className="text-gray-300">Normal</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-400 mr-1"></div>
                <span className="text-gray-300">Underutilized</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                <span className="text-gray-300">Overutilized</span>
              </div>
            </div>

            <UsageMap rows={mapData} />
          </div>
        </div>

        {/* Raw Metrics Table */}
        <div className="mb-6">
          <RawMetricsTable data={usageData || []} />
        </div>

        {/* Additional Insights */}
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-green-400" />
            Operational Summary
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-gradient-to-r from-blue-900/50 to-blue-800/50 rounded-lg border border-blue-700/50">
              <div className="text-lg font-semibold text-blue-300">Contract Overview</div>
              <div className="mt-2 space-y-1">
                <div className="text-sm text-blue-200">
                  Total Contracts: {Number(analytics?.rental?.total_contracts) || 0}
                </div>
                <div className="text-sm text-blue-200">
                  Active: {Number(analytics?.rental?.active_contracts) || 0}
                </div>
                <div className="text-sm text-blue-200">
                  Total Rental Hours: {totalRentalHours.toFixed(0)}h
                </div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-green-900/50 to-green-800/50 rounded-lg border border-green-700/50">
              <div className="text-lg font-semibold text-green-300">Runtime Efficiency</div>
              <div className="mt-2 space-y-1">
                <div className="text-sm text-green-200">
                  Productive: {Number(analytics?.runtime?.total_productive_hours)?.toFixed(0) || 0}h
                </div>
                <div className="text-sm text-green-200">
                  Idle: {Number(analytics?.runtime?.total_idle_hours)?.toFixed(0) || 0}h
                </div>
                <div className="text-sm text-green-200">
                  Efficiency: {totalRuntimeHours > 0 ? ((Number(analytics?.runtime?.total_productive_hours) || 0) / totalRuntimeHours * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-purple-900/50 to-purple-800/50 rounded-lg border border-purple-700/50">
              <div className="text-lg font-semibold text-purple-300">Maintenance Alerts</div>
              <div className="mt-2 space-y-1">
                <div className="text-sm text-purple-200">
                  Total Incidents: {downTimeIncidents}
                </div>
                <div className="text-sm text-purple-200">
                  Critical: {Number(analytics?.downtime?.critical_incidents) || 0}
                </div>
                <div className="text-sm text-purple-200">
                  Avg Error Rate: {Number(analytics?.downtime?.avg_error_frequency)?.toFixed(1) || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}