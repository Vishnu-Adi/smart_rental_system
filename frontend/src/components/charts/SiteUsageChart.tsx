"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { UsageAnalytics } from '@/lib/types';

interface SiteUsageChartProps {
  data: UsageAnalytics['siteUsage'];
}

export function SiteUsageChart({ data }: SiteUsageChartProps) {
  const chartData = data.map((item, index) => ({
    site: `Site ${index + 1}`,
    fullSite: item.site,
    machines: Number(item.machines_count) || 0,
    hours: Number(item.site_runtime_hours) || 0,
    fuelConsumption: Number(item.avg_fuel_consumption) || 0,
    efficiency: item.machines_count > 0 ? Number(item.site_runtime_hours) / Number(item.machines_count) : 0
  })).sort((a, b) => b.hours - a.hours);

  const totalMachines = chartData.reduce((sum, d) => sum + d.machines, 0);
  const totalHours = chartData.reduce((sum, d) => sum + d.hours, 0);
  const topSite = chartData[0];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Usage by Location</h3>
        <div className="text-sm text-gray-500">
          Top 10 Sites
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border-l-4 border-blue-500">
          <div className="text-lg font-bold text-blue-700">
            {data.length}
          </div>
          <div className="text-xs text-blue-600">Active Sites</div>
          <div className="text-[10px] text-gray-500">
            With Equipment
          </div>
        </div>

        <div className="p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border-l-4 border-green-500">
          <div className="text-lg font-bold text-green-700">
            {totalMachines}
          </div>
          <div className="text-xs text-green-600">Total Machines</div>
          <div className="text-[10px] text-gray-500">
            Across All Sites
          </div>
        </div>

        <div className="p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border-l-4 border-purple-500">
          <div className="text-lg font-bold text-purple-700">
            {totalHours.toFixed(0)}h
          </div>
          <div className="text-xs text-purple-600">Total Hours</div>
          <div className="text-[10px] text-gray-500">
            All Locations
          </div>
        </div>

        <div className="p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border-l-4 border-orange-500">
          <div className="text-lg font-bold text-orange-700">
            {topSite?.efficiency?.toFixed(1) || 0}
          </div>
          <div className="text-xs text-orange-600">Top Site Efficiency</div>
          <div className="text-[10px] text-gray-500">
            Hours/Machine
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="site"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              yAxisId="hours"
              label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
              fontSize={12}
            />
            <YAxis 
              yAxisId="machines"
              orientation="right"
              label={{ value: 'Machines', angle: 90, position: 'insideRight' }}
              fontSize={12}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
                      <p className="font-semibold text-gray-900 mb-2">{label}</p>
                      <p className="text-xs text-gray-600 mb-2">
                        Coordinates: {data.fullSite}
                      </p>
                      <div className="space-y-1">
                        <p className="text-sm text-blue-600">
                          Runtime: {data.hours.toFixed(1)} hours
                        </p>
                        <p className="text-sm text-green-600">
                          Machines: {data.machines}
                        </p>
                        <p className="text-sm text-purple-600">
                          Efficiency: {data.efficiency.toFixed(1)} hrs/machine
                        </p>
                        <p className="text-sm text-orange-600">
                          Fuel: {data.fuelConsumption.toFixed(1)} L/hr
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Bar 
              yAxisId="hours"
              dataKey="hours" 
              name="Runtime Hours"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              yAxisId="machines"
              dataKey="machines" 
              name="Machine Count"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
