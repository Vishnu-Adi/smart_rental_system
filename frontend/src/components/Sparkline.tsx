import { AreaChart, Area, ResponsiveContainer } from 'recharts';

export function Sparkline<T extends Record<string, unknown>>({ data, dataKey, color = '#3b82f6' }: { data: T[]; dataKey: string; color?: string }) {
  return (
    <div className="w-full h-20">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
          <Area type="monotone" dataKey={dataKey} stroke={color} fill={color} fillOpacity={0.15} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}


