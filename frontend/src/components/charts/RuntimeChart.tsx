"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { UsageAnalytics } from '@/lib/types';

interface RuntimeChartProps {
  data: UsageAnalytics['runtime'];
}

export function RuntimeChart({ data }: RuntimeChartProps) {
  const chartData = [
    { 
      name: 'Productive Hours', 
      value: Number(data.total_productive_hours) || 0, 
      color: '#22c55e' 
    },
    { 
      name: 'Idle Hours', 
      value: Number(data.total_idle_hours) || 0, 
      color: '#f59e0b' 
    }
  ];

  const COLORS = ['#22c55e', '#f59e0b'];

  const totalHours = chartData.reduce((sum, entry) => sum + entry.value, 0);
  const productivityRate = totalHours > 0 ? (Number(data.total_productive_hours) / totalHours * 100) : 0;

  return (
    <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Runtime Analysis</h3>
        <div className="text-sm text-gray-400">
          {totalHours.toFixed(0)} total hours
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`${value.toFixed(1)} hrs`, 'Hours']}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Stats */}
        <div className="space-y-4">
          <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
            <div className="text-2xl font-bold text-green-700">
              {productivityRate.toFixed(1)}%
            </div>
            <div className="text-sm text-green-600">Productivity Rate</div>
            <div className="text-xs text-gray-500 mt-1">
              Productive vs Total Runtime
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <div className="text-2xl font-bold text-blue-700">
              {Number(data.active_machines) || 0}
            </div>
            <div className="text-sm text-blue-600">Active Machines</div>
            <div className="text-xs text-gray-500 mt-1">
              Currently Tracked
            </div>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
            <div className="text-2xl font-bold text-purple-700">
              {Number(data.avg_fuel_rate)?.toFixed(1) || 0}
            </div>
            <div className="text-sm text-purple-600">Avg Fuel Rate</div>
            <div className="text-xs text-gray-500 mt-1">
              L/hr Consumption
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
