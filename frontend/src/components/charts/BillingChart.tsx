"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface BillingData {
  completed: number;
  pending: number;
  unknown: number;
}

interface BillingChartProps {
  data: BillingData;
}

const COLORS = ['#10b981', '#f59e0b', '#6b7280'];

export function BillingChart({ data }: BillingChartProps) {
  const chartData = [
    { name: 'Completed', value: data.completed, color: COLORS[0] },
    { name: 'Pending', value: data.pending, color: COLORS[1] },
    { name: 'Unknown', value: data.unknown, color: COLORS[2] },
  ].filter(item => item.value > 0); // Only show non-zero values

  const total = data.completed + data.pending + data.unknown;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Payment Status</CardTitle>
        <CardDescription>Contract payment status breakdown</CardDescription>
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
                `${value} contracts (${((value / total) * 100).toFixed(1)}%)`, 
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
