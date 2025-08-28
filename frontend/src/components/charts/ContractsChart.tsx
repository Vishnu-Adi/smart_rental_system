"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ContractsData {
  completed: number;
  ongoing: number;
  overdue: number;
}

interface ContractsChartProps {
  data: ContractsData;
}

const COLORS = ['#10b981', '#3b82f6', '#ef4444'];

export function ContractsChart({ data }: ContractsChartProps) {
  const chartData = [
    { name: 'Completed', value: data.completed, color: COLORS[0] },
    { name: 'Ongoing', value: data.ongoing, color: COLORS[1] },
    { name: 'Overdue', value: data.overdue, color: COLORS[2] },
  ].filter(item => item.value > 0); // Only show non-zero values

  const total = data.completed + data.ongoing + data.overdue;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Contract Status</CardTitle>
        <CardDescription>Rental contract progress overview</CardDescription>
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
