import { render } from '@testing-library/react';
import * as apiModule from '@/lib/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MachineDetailPage from './page';

jest.mock('@/lib/api');
jest.mock('next/navigation', () => ({ useParams: () => ({ machineId: '1' }) }));

function wrapper(ui: React.ReactNode) {
  const qc = new QueryClient();
  return <QueryClientProvider client={qc}>{ui}</QueryClientProvider>;
}

describe('Machine detail', () => {
  it('renders charts for mock payload', async () => {
    (apiModule.api.getMachineDetail as jest.Mock).mockResolvedValue({
      machine: { machine_id: 1, asset_type: 'excavator', manufacturer: 'X', year_of_manufacture: 2020, current_location_lat: 0, current_location_lon: 0, status: 'available', rental_price_per_hour: 0, rental_price_per_day: 0, rentalStatus: 'Available', currentRenter: null },
      sensorReadings: [
        { timestamp: '2024-01-01T00:00:00Z', avg_fuel_consumption_rate: 1, idle_fuel_consumption_pct: 10, rpm_variance: 100, coolant_temp_anomalies: 1, productive_time_mins: 10, idle_time_mins: 5, vibration_anomalies: 1, overload_cycles: 1, over_speed_events: 0, tire_pressure_deviations: 0, error_code_frequency: 0, battery_low_voltage_events: 0 },
      ],
    });
    render(wrapper(<MachineDetailPage/>));
  });
});


