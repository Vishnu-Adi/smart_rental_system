import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export function Donut({ data }: { data: { name: string; value: number }[] }) {
  const colors = ['#4ade80', '#60a5fa', '#fbbf24', '#9ca3af', '#34d399', '#f472b6'];
  return (
    <div className="w-full h-60">
      <ResponsiveContainer>
        <PieChart>
          <Pie dataKey="value" data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}


