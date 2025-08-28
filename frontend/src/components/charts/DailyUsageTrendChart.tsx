"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import { UsageAnalytics } from '@/lib/types';

interface DailyUsageTrendChartProps {
  data: UsageAnalytics['dailyTrends'];
}

export function DailyUsageTrendChart({ data }: DailyUsageTrendChartProps) {
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    fullDate: item.date,
    productive: Number(item.productive_hours) || 0,
    idle: Number(item.idle_hours) || 0,
    total: (Number(item.productive_hours) || 0) + (Number(item.idle_hours) || 0),
    fuelRate: Number(item.avg_fuel_rate) || 0,
    machines: Number(item.active_machines) || 0
  })).reverse(); // Show chronological order

  const avgProductiveHours = chartData.length > 0 
    ? chartData.reduce((sum, d) => sum + d.productive, 0) / chartData.length 
    : 0;

  const peakDay = chartData.reduce((max, d) => d.total > max.total ? d : max, chartData[0] || { total: 0, date: '' });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Daily Usage Trends</h3>
        <div className="text-sm text-gray-500">
          Last 30 Days
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border-l-4 border-blue-500">
          <div className="text-lg font-bold text-blue-700">
            {avgProductiveHours.toFixed(1)}h
          </div>
          <div className="text-xs text-blue-600">Avg Daily Productive</div>
          <div className="text-[10px] text-gray-500">
            Per Day Average
          </div>
        </div>

        <div className="p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border-l-4 border-green-500">
          <div className="text-lg font-bold text-green-700">
            {peakDay?.total?.toFixed(1) || 0}h
          </div>
          <div className="text-xs text-green-600">Peak Usage Day</div>
          <div className="text-[10px] text-gray-500">
            {peakDay?.date || 'N/A'}
          </div>
        </div>

        <div className="p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border-l-4 border-purple-500">
          <div className="text-lg font-bold text-purple-700">
            {chartData.length > 0 ? chartData[chartData.length - 1]?.machines : 0}
          </div>
          <div className="text-xs text-purple-600">Active Machines</div>
          <div className="text-[10px] text-gray-500">
            Latest Count
          </div>
        </div>
      </div>

      {/* Area Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
              fontSize={12}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
                      <p className="font-semibold text-gray-900 mb-2">{label}</p>
                      <div className="space-y-1">
                        <p className="text-sm text-green-600">
                          Productive: {data.productive.toFixed(1)} hrs
                        </p>
                        <p className="text-sm text-orange-600">
                          Idle: {data.idle.toFixed(1)} hrs
                        </p>
                        <p className="text-sm text-blue-600">
                          Total: {data.total.toFixed(1)} hrs
                        </p>
                        <p className="text-sm text-purple-600">
                          Machines: {data.machines}
                        </p>
                        <p className="text-sm text-gray-600">
                          Fuel Rate: {data.fuelRate.toFixed(1)} L/hr
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="productive"
              stackId="1"
              stroke="#22c55e"
              fill="#22c55e"
              fillOpacity={0.7}
              name="Productive Hours"
            />
            <Area
              type="monotone"
              dataKey="idle"
              stackId="1"
              stroke="#f59e0b"
              fill="#f59e0b"
              fillOpacity={0.7}
              name="Idle Hours"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
