"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HealthRow } from '@/lib/types';
import { toNum } from '@/lib/format';
import { AlertTriangle, Activity, Wrench } from 'lucide-react';

interface HealthRiskChartProps {
  data: HealthRow[];
}

export function HealthRiskChart({ data }: HealthRiskChartProps) {
  // Group machines by risk level and calculate distribution
  const riskDistribution = data.reduce((acc, machine) => {
    const risk = toNum(machine.downtime_risk_pct);
    let level: 'Low Risk' | 'Medium Risk' | 'High Risk' | 'Critical Risk';
    
    if (risk >= 80) level = 'Critical Risk';
    else if (risk >= 60) level = 'High Risk';
    else if (risk >= 30) level = 'Medium Risk';
    else level = 'Low Risk';
    
    if (!acc[level]) acc[level] = [];
    acc[level].push(machine);
    return acc;
  }, {} as Record<string, HealthRow[]>);

  const chartData = [
    { name: 'Low Risk', count: riskDistribution['Low Risk']?.length || 0, color: '#10b981' },
    { name: 'Medium Risk', count: riskDistribution['Medium Risk']?.length || 0, color: '#f59e0b' },
    { name: 'High Risk', count: riskDistribution['High Risk']?.length || 0, color: '#ef4444' },
    { name: 'Critical Risk', count: riskDistribution['Critical Risk']?.length || 0, color: '#dc2626' },
  ];

  const totalMachines = data.length;
  const criticalCount = chartData[3].count;
  const highRiskCount = chartData[2].count + criticalCount;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Downtime Risk Distribution
        </CardTitle>
        <CardDescription>
          Machine health risk assessment across fleet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Key Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
              <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
              <div className="text-xs text-red-600">Critical Risk</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500">
              <div className="text-2xl font-bold text-orange-600">{highRiskCount}</div>
              <div className="text-xs text-orange-600">High+ Risk</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
              <div className="text-2xl font-bold text-green-600">{((totalMachines - highRiskCount) / totalMachines * 100).toFixed(0)}%</div>
              <div className="text-xs text-green-600">Healthy Fleet</div>
            </div>
          </div>

          {/* Bar Chart */}
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="name" 
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis fontSize={12} />
              <Tooltip 
                formatter={(value: number, name) => [
                  `${value} machines (${((value / totalMachines) * 100).toFixed(1)}%)`,
                  'Count'
                ]}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
