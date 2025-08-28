"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { UsageAnalytics } from '@/lib/types';

interface FuelAnalysisChartProps {
  data: UsageAnalytics['fuelByType'];
}

export function FuelAnalysisChart({ data }: FuelAnalysisChartProps) {
  const chartData = data.map(item => ({
    assetType: item.asset_type,
    fuelRate: Number(item.avg_fuel_rate) || 0,
    hours: Number(item.total_hours) || 0,
    machines: Number(item.machine_count) || 0,
    efficiency: item.total_hours > 0 ? Number(item.total_hours) / Number(item.avg_fuel_rate) : 0
  })).sort((a, b) => b.fuelRate - a.fuelRate);

  const maxFuelRate = Math.max(...chartData.map(d => d.fuelRate));
  const bestEfficiency = chartData.length > 0 ? Math.max(...chartData.map(d => d.efficiency)) : 0;
  const mostEfficient = chartData.find(d => d.efficiency === bestEfficiency);

  return (
    <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Fuel Consumption by Asset Type</h3>
        <div className="text-sm text-gray-400">
          Average Rate (L/hr)
        </div>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
          <div className="text-lg font-bold text-green-700">
            {mostEfficient?.assetType || 'N/A'}
          </div>
          <div className="text-xs text-green-600">Most Fuel Efficient</div>
          <div className="text-[10px] text-gray-500">
            {mostEfficient?.fuelRate.toFixed(1)} L/hr
          </div>
        </div>

        <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
          <div className="text-lg font-bold text-blue-700">
            {chartData.reduce((sum, d) => sum + d.hours, 0).toFixed(0)}
          </div>
          <div className="text-xs text-blue-600">Total Runtime</div>
          <div className="text-[10px] text-gray-500">
            All Asset Types
          </div>
        </div>

        <div className="p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500">
          <div className="text-lg font-bold text-orange-700">
            {maxFuelRate.toFixed(1)}
          </div>
          <div className="text-xs text-orange-600">Highest Consumption</div>
          <div className="text-[10px] text-gray-500">
            L/hr Maximum
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
              dataKey="assetType" 
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={12}
            />
            <YAxis 
              label={{ value: 'Fuel Rate (L/hr)', angle: -90, position: 'insideLeft' }}
              fontSize={12}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                      <p className="font-semibold text-gray-900">{label}</p>
                      <p className="text-sm text-blue-600">
                        Fuel Rate: {data.fuelRate.toFixed(1)} L/hr
                      </p>
                      <p className="text-sm text-green-600">
                        Runtime: {data.hours.toFixed(0)} hrs
                      </p>
                      <p className="text-sm text-purple-600">
                        Machines: {data.machines}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Bar 
              dataKey="fuelRate" 
              name="Avg Fuel Rate (L/hr)"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
