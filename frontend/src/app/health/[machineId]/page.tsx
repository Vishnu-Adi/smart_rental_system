"use client";
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Loader from '@/components/Loader';
import ErrorState from '@/components/ErrorState';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { computeAnomalies } from '@/lib/anomalies';
import { AnomalyChips } from '@/components/AnomalyChips';
import { toNum } from '@/lib/format';

export default function MachineDetailPage() {
  const params = useParams();
  const id = Number(params?.machineId);
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['machine', id], queryFn: () => api.getMachineDetail(id), staleTime: 30_000, enabled: !!id });

  if (isLoading) return <Loader/>;
  if (error) return <ErrorState error={error} retry={refetch}/>;
  if (!data) return null;

  const readings = data.sensorReadings.map(r => ({
    ...r,
    avg_fuel_consumption_rate: toNum(r.avg_fuel_consumption_rate),
    idle_fuel_consumption_pct: toNum(r.idle_fuel_consumption_pct),
    rpm_variance: toNum(r.rpm_variance),
    coolant_temp_anomalies: toNum(r.coolant_temp_anomalies),
    productive_time_mins: toNum(r.productive_time_mins),
    idle_time_mins: toNum(r.idle_time_mins),
    vibration_anomalies: toNum(r.vibration_anomalies),
    overload_cycles: toNum(r.overload_cycles),
    over_speed_events: toNum(r.over_speed_events),
    tire_pressure_deviations: toNum(r.tire_pressure_deviations),
    error_code_frequency: toNum(r.error_code_frequency),
    battery_low_voltage_events: toNum(r.battery_low_voltage_events),
  }));
  const anomalies = computeAnomalies(readings);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-lg font-semibold">{data.machine.asset_type} #{data.machine.machine_id}</div>
        <div className="text-sm text-muted-foreground">{data.machine.manufacturer} • {data.machine.year_of_manufacture} • {data.machine.status}</div>
      </div>

      <AnomalyChips items={anomalies} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartLine title="Fuel rate" data={readings} dataKey="avg_fuel_consumption_rate" color="#3b82f6" />
        <ChartLine title="Idle %" data={readings} dataKey="idle_fuel_consumption_pct" color="#f59e0b" />
        <ChartLine title="RPM variance" data={readings} dataKey="rpm_variance" color="#22c55e" />
        <ChartBars title="Temp/Errors/Electrical" data={readings} />
        <ChartStacked title="Productive vs Idle" data={readings} />
      </div>
    </div>
  );
}

function ChartLine<T extends Record<string, unknown>>({ title, data, dataKey, color }: { title: string; data: T[]; dataKey: string; color: string }) {
  return (
    <div>
      <div className="text-sm font-medium mb-2">{title}</div>
      <div className="w-full h-60">
        <ResponsiveContainer>
          <LineChart data={data}>
            <XAxis dataKey="timestamp" hide />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={dataKey} stroke={color} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ChartBars<T extends Record<string, unknown>>({ title, data }: { title: string; data: T[] }) {
  return (
    <div>
      <div className="text-sm font-medium mb-2">{title}</div>
      <div className="w-full h-60">
        <ResponsiveContainer>
          <BarChart data={data}>
            <XAxis dataKey="timestamp" hide />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="coolant_temp_anomalies" fill="#3b82f6" />
            <Bar dataKey="error_code_frequency" fill="#ef4444" />
            <Bar dataKey="battery_low_voltage_events" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ChartStacked<T extends Record<string, unknown>>({ title, data }: { title: string; data: T[] }) {
  return (
    <div>
      <div className="text-sm font-medium mb-2">{title}</div>
      <div className="w-full h-60">
        <ResponsiveContainer>
          <AreaChart data={data}>
            <XAxis dataKey="timestamp" hide />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="productive_time_mins" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
            <Area type="monotone" dataKey="idle_time_mins" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


