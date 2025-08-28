"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HealthRow } from '@/lib/types';
import { toNum } from '@/lib/format';
import { Activity, TrendingDown } from 'lucide-react';

interface HealthTrendChartProps {
  data: HealthRow[];
}

export function HealthTrendChart({ data }: HealthTrendChartProps) {
  // Group machines by manufacturer and calculate average health metrics
  const manufacturerData = data.reduce((acc, machine) => {
    const { manufacturer } = machine;
    if (!acc[manufacturer]) {
      acc[manufacturer] = {
        machines: [],
        totalFuelEff: 0,
        totalSafety: 0,
        totalUtilization: 0,
        totalWearTear: 0,
        count: 0
      };
    }
    
    acc[manufacturer].machines.push(machine);
    acc[manufacturer].totalFuelEff += toNum(machine.fuel_efficiency_score);
    acc[manufacturer].totalSafety += toNum(machine.safety_score);
    acc[manufacturer].totalUtilization += toNum(machine.utilization_ratio);
    acc[manufacturer].totalWearTear += toNum(machine.wear_and_tear_index);
    acc[manufacturer].count += 1;
    
    return acc;
  }, {} as Record<string, any>);

  // Create chart data with averages
  const chartData = Object.entries(manufacturerData).map(([manufacturer, data]) => ({
    manufacturer: manufacturer.replace(/\s+/g, ' ').trim(),
    avgFuelEff: Math.round(data.totalFuelEff / data.count),
    avgSafety: Math.round(data.totalSafety / data.count),
    avgUtilization: Math.round(data.totalUtilization / data.count),
    avgWearTear: Math.round(data.totalWearTear / data.count),
    machineCount: data.count,
    // Calculate overall health score (higher is better)
    healthScore: Math.round(
      (data.totalFuelEff / data.count + 
       data.totalSafety / data.count + 
       data.totalUtilization / data.count + 
       (100 - data.totalWearTear / data.count)) / 4
    )
  })).sort((a, b) => b.healthScore - a.healthScore);

  // Calculate fleet insights
  const totalMachines = data.length;
  const avgFleetHealth = Math.round(chartData.reduce((sum, item) => sum + item.healthScore * item.machineCount, 0) / totalMachines);
  const topPerformer = chartData[0];
  const needsAttention = chartData.filter(item => item.healthScore < 60).length;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5 text-green-500" />
          Health by Manufacturer
        </CardTitle>
        <CardDescription>
          Comparative health performance across brands
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Key Insights */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <div className="text-2xl font-bold text-blue-600">{avgFleetHealth}</div>
              <div className="text-xs text-blue-600">Fleet Health</div>
              <div className="text-[10px] text-gray-500">Average Score</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
              <div className="text-xl font-bold text-green-600">{topPerformer?.manufacturer.split(' ')[0]}</div>
              <div className="text-xs text-green-600">Top Brand</div>
              <div className="text-[10px] text-gray-500">{topPerformer?.healthScore}% Score</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500">
              <div className="text-2xl font-bold text-orange-600">{needsAttention}</div>
              <div className="text-xs text-orange-600">Brands &lt; 60%</div>
              <div className="text-[10px] text-gray-500">Need Attention</div>
            </div>
          </div>

          {/* Area Chart */}
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
              <defs>
                <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="safetyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="efficiencyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="manufacturer" 
                fontSize={10}
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis 
                fontSize={11}
                domain={[0, 100]}
                label={{ value: 'Score %', angle: -90, position: 'insideLeft', fontSize: 10 }}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  `${value}%`,
                  name === 'healthScore' ? 'Overall Health' :
                  name === 'avgSafety' ? 'Safety Score' :
                  name === 'avgFuelEff' ? 'Fuel Efficiency' : name
                ]}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    const data = payload[0].payload;
                    return `${label} (${data.machineCount} machines)`;
                  }
                  return label;
                }}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Legend fontSize={11} />
              
              <Area 
                type="monotone" 
                dataKey="healthScore" 
                stroke="#10b981" 
                fill="url(#healthGradient)"
                strokeWidth={2}
                name="Overall Health"
              />
              <Line 
                type="monotone" 
                dataKey="avgSafety" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Safety Score"
              />
              <Line 
                type="monotone" 
                dataKey="avgFuelEff" 
                stroke="#f59e0b" 
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Fuel Efficiency"
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Bottom Stats */}
          <div className="flex justify-between text-xs text-gray-600">
            <span>Best: {topPerformer?.manufacturer} ({topPerformer?.healthScore}%)</span>
            <span>Fleet Average: {avgFleetHealth}%</span>
            <span>Brands Tracked: {chartData.length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
