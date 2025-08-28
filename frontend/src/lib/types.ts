// Shared TypeScript interfaces for the Smart Rental Tracking System frontend

export type MachineStatus = 'available' | 'rented' | 'under_maintenance' | 'decommissioned';

export type AssetRow = {
  machine_id: number;
  asset_type: string;
  manufacturer: string;
  year_of_manufacture: number;
  current_location_lat: number;
  current_location_lon: number;
  status: MachineStatus;
  rental_price_per_hour: number | string;
  rental_price_per_day: number | string;
  rentalStatus: string;
  currentRenter: string | null;
};

export type AssetsResponse = {
  assets: AssetRow[];
  summary: { total: number; rented: number; available: number; rentedPercentage: number };
  categoryDistribution: Record<string, number>;
};

export type HealthRow = {
  machine_id: number;
  name: string;
  manufacturer: string;
  log_timestamp: string;
  fuel_efficiency_score: number | string;
  engine_stability_score: number | string;
  utilization_ratio: number | string;
  wear_and_tear_index: number | string;
  safety_score: number | string;
  downtime_risk_pct: number | string;
};

export type SensorReading = {
  timestamp: string;
  avg_fuel_consumption_rate: number | string;
  idle_fuel_consumption_pct: number | string;
  rpm_variance: number | string;
  coolant_temp_anomalies: number | string;
  productive_time_mins: number | string;
  idle_time_mins: number | string;
  vibration_anomalies: number | string;
  overload_cycles: number | string;
  over_speed_events: number | string;
  tire_pressure_deviations: number | string;
  error_code_frequency: number | string;
  battery_low_voltage_events: number | string;
};

export type MachineDetail = {
  machine: AssetRow;
  sensorReadings: SensorReading[];
};

export type UsageRow = {
  machine_id: number;
  name: string;
  location_lat: number | string;
  location_lon: number | string;
  timestamp: string;
  productive_time_mins: number | string;
  idle_time_mins: number | string;
  avg_fuel_consumption_rate: number | string;
  idle_fuel_consumption_pct: number | string;
  rpm_variance: number | string;
  coolant_temp_anomalies: number | string;
  vibration_anomalies: number | string;
  overload_cycles: number | string;
  over_speed_events: number | string;
  tire_pressure_deviations: number | string;
  error_code_frequency: number | string;
  battery_low_voltage_events: number | string;
  utilization_status: 'Normal' | 'Underutilized' | 'Overutilized';
};

export type ForecastRow = { month: string; rentals: number | string };

export type CustomerRow = {
  company_id: number;
  name: string;
  industry: string;
  address: string;
  location_lat: number | string;
  location_lon: number | string;
  state: string;
  segment: string;
  sustainability_score: number | string;
  totalRentals: number | string;
  onTimeReturnRate: number | string;
  avgSafetyScore: number | string;
  avgWearIndex: number | string;
};

export type ApiError = { message: string; status?: number };

export interface DashboardAnalytics {
  assetTypes: Array<{
    asset_type: string;
    total: number;
    available: number;
    used: number;
  }>;
  availability: {
    available: number;
    unavailable: number;
  };
  billing: {
    completed: number;
    pending: number;
    unknown: number;
  };
  contracts: {
    completed: number;
    ongoing: number;
    overdue: number;
  };
}

export interface UsageAnalytics {
  runtime: {
    total_runtime_hours: number;
    total_productive_hours: number;
    total_idle_hours: number;
    avg_fuel_rate: number;
    active_machines: number;
  };
  rental: {
    total_rental_hours: number;
    total_contracts: number;
    active_contracts: number;
  };
  siteUsage: Array<{
    site: string;
    machines_count: number;
    site_runtime_hours: number;
    avg_fuel_consumption: number;
  }>;
  fuelByType: Array<{
    asset_type: string;
    avg_fuel_rate: number;
    total_hours: number;
    machine_count: number;
  }>;
  dailyTrends: Array<{
    date: string;
    productive_hours: number;
    idle_hours: number;
    avg_fuel_rate: number;
    active_machines: number;
  }>;
  downtime: {
    total_incidents: number;
    critical_incidents: number;
    avg_error_frequency: number;
  };
}

export interface AdvancedForecastData {
  demandPredictions: Array<{
    asset_type: string;
    location: string;
    month: number;
    predicted_demand: number;
    expected_duration: number;
    trend_factor: number;
    demand_category: string;
  }>;
  projectDNA: Array<{
    industry: string;
    equipment_combo: string;
    pattern_frequency: number;
    typical_duration: number;
    success_probability: number;
    pattern_confidence: string;
  }>;
  competitiveActivity: Array<{
    asset_type: string;
    recent_bookings: number;
    unique_companies: number;
    avg_rental_days: number;
    normal_weekly_average: number;
    activity_spike_pct: number;
    alert_level: string;
  }>;
  economicIndicators: Array<{
    indicator: string;
    region: string;
    current_value: number;
    trend: string;
    impact_on_demand: string;
    equipment_affected: string[];
  }>;
  tradingFloor: Array<{
    asset_type: string;
    available_units: number;
    total_bookings: number;
    future_bookings: number;
    competing_companies: number;
    demand_pressure_pct: number;
    market_status: string;
    suggested_bid_price: number;
  }>;
  collaborativeInsights: Array<{
    shared_by: string;
    insight: string;
    equipment_type: string;
    confidence_level: number;
    impact_timeframe: string;
    region: string;
  }>;
}

// Customer Portal Types
export interface User {
  id: string | number;
  username: string;
  userType: 'admin' | 'customer';
  company_id?: number;
}

export interface AuthResponse {
  message: string;
  user: User;
}

export interface Company {
  company_id: number;
  name: string;
}

export interface CustomerDashboard {
  companyInfo: {
    name: string;
    industry: string;
    address: string;
    state: string;
    segment: string;
  };
  contractSummary: {
    active: number;
    completed: number;
    overdue: number;
  };
  financials: {
    totalBilledAmount: number;
    paidInvoices: number;
    pendingInvoices: number;
  };
  activeMachineCount: number;
  activeMachines: Array<{
    machine_id: number;
    asset_type: string;
    manufacturer: string;
    end_date: string;
  }>;
}

export interface Notification {
  id: number;
  client_id: number;
  contract_id?: number;
  notification_type: 'checkout_reminder' | 'payment_due' | 'contract_renewal' | 'maintenance_alert' | 'general';
  message: string;
  is_read: boolean;
  sent_at: string;
  read_at?: string;
}

