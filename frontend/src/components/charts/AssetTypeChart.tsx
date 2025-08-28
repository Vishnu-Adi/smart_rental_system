"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AssetTypeData {
  asset_type: string;
  total: number;
  available: number;
  used: number;
}

interface AssetTypeChartProps {
  data: AssetTypeData[];
}

export function AssetTypeChart({ data }: AssetTypeChartProps) {
  const chartData = data.map(item => ({
    type: item.asset_type.charAt(0).toUpperCase() + item.asset_type.slice(1),
    Available: item.available,
    'In Use': item.used,
  }));

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Asset Distribution</CardTitle>
        <CardDescription>Available vs In-Use by asset type</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="type" 
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar dataKey="Available" fill="#22c55e" radius={[2, 2, 0, 0]} />
            <Bar dataKey="In Use" fill="#3b82f6" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
