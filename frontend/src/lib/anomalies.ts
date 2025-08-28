import { SensorReading } from '@/lib/types';
import { toNum } from '@/lib/format';

export type Anomaly = 'Idle spike' | 'Engine instability' | 'Wear burst' | 'Misuse' | 'Electrical';

export const computeAnomalies = (readings: SensorReading[]): Anomaly[] => {
  if (!readings || readings.length === 0) return [];
  const latest = readings[readings.length - 1];
  const idleSpike = toNum(latest.idle_time_mins) === 15 || toNum(latest.idle_fuel_consumption_pct) >= 60;
  const engineInstability = toNum(latest.rpm_variance) >= 220 || toNum(latest.coolant_temp_anomalies) >= 4;
  const wearBurst = toNum(latest.vibration_anomalies) >= 8 || toNum(latest.overload_cycles) >= 6;
  const misuse = toNum(latest.over_speed_events) >= 8 || toNum(latest.tire_pressure_deviations) >= 6;
  const electrical = toNum(latest.error_code_frequency) >= 8 || toNum(latest.battery_low_voltage_events) >= 5;
  const result: Anomaly[] = [];
  if (idleSpike) result.push('Idle spike');
  if (engineInstability) result.push('Engine instability');
  if (wearBurst) result.push('Wear burst');
  if (misuse) result.push('Misuse');
  if (electrical) result.push('Electrical');
  return result;
};


