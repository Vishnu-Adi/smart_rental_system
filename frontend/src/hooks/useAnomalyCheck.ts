
import { useState, useEffect } from 'react';
import { UsageRow } from '@/lib/types';

type AnomalyState = {
  loading: boolean;
  isAnomaly: boolean | null;
  score?: number;
  error?: string;
};

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001';

export function useAnomalyCheck(rows: UsageRow[]) {
  const [anomalyMap, setAnomalyMap] = useState<Record<number, AnomalyState>>({});

  useEffect(() => {
    const checkAnomalies = async () => {
      for (const row of rows) {
        const machineId = Number(row.machine_id);
        if (!machineId) continue;

        // Skip if already checked (has a result) or is currently loading
        const currentState = anomalyMap[machineId];
        if (currentState?.loading || currentState?.isAnomaly !== undefined) {
          continue;
        }

        // Set loading state
        setAnomalyMap(prev => ({ ...prev, [machineId]: { loading: true, isAnomaly: null } }));

        try {
          const payload = {
            avg_fuel_consumption_rate: Number(row.avg_fuel_consumption_rate || 0),
            idle_fuel_consumption_pct: Number(row.idle_fuel_consumption_pct || 0),
            rpm_variance: Number(row.rpm_variance || 0),
            coolant_temp_anomalies: Number(row.coolant_temp_anomalies || 0),
            productive_time_mins: Number(row.productive_time_mins || 0),
            idle_time_mins: Number(row.idle_time_mins || 0),
            vibration_anomalies: Number(row.vibration_anomalies || 0),
            over_speed_events: Number(row.over_speed_events || 0),
            tire_pressure_deviations: Number(row.tire_pressure_deviations || 0),
            error_code_frequency: Number(row.error_code_frequency || 0),
            battery_low_voltage_events: Number(row.battery_low_voltage_events || 0),
          };

          const res = await fetch(`${baseUrl}/api/anomaly/check?learn=false`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!res.ok) throw new Error(`API error: ${res.status}`);
          
          const result = await res.json();
          const isAnomaly = Boolean(result.is_anomaly ?? false);
          const score = typeof result.score === 'number' ? result.score : undefined;

          setAnomalyMap(prev => ({
            ...prev,
            [machineId]: { loading: false, isAnomaly, score },
          }));

        } catch (err: any) {
          setAnomalyMap(prev => ({
            ...prev,
            [machineId]: { loading: false, isAnomaly: null, error: err.message || 'Fetch failed' },
          }));
        }
      }
    };

    checkAnomalies();
  }, [rows]); // Dependency is now just the visible rows

  return anomalyMap;
}
