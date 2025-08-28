"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AvailabilityData {
  available: number;
  unavailable: number;
}

interface AvailabilityChartProps {
  data: AvailabilityData;
}

const COLORS = ['#22c55e', '#ef4444'];

export function AvailabilityChart({ data }: AvailabilityChartProps) {
  const chartData = [
    { name: 'Available', value: data.available, color: COLORS[0] },
    { name: 'In Use', value: data.unavailable, color: COLORS[1] },
  ];

  const total = data.available + data.unavailable;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Fleet Availability</CardTitle>
        <CardDescription>Current availability status</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
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
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [
                `${value} machines (${((value / total) * 100).toFixed(1)}%)`, 
                ''
              ]}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
