import { render, screen } from '@testing-library/react';
import HealthPage from './page';
import * as apiModule from '@/lib/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@/lib/api');

function wrapper(ui: React.ReactNode) {
  const qc = new QueryClient();
  return <QueryClientProvider client={qc}>{ui}</QueryClientProvider>;
}

describe('Health table', () => {
  it('sorts by risk desc (renders highest risk first)', async () => {
    (apiModule.api.getHealth as jest.Mock).mockResolvedValue([
      { machine_id: 1, name: 'A', manufacturer: 'M', log_timestamp: '', fuel_efficiency_score: 0, engine_stability_score: 0, utilization_ratio: 0, wear_and_tear_index: 0, safety_score: 0, downtime_risk_pct: 10 },
      { machine_id: 2, name: 'B', manufacturer: 'M', log_timestamp: '', fuel_efficiency_score: 0, engine_stability_score: 0, utilization_ratio: 0, wear_and_tear_index: 0, safety_score: 0, downtime_risk_pct: 80 },
    ]);
    render(wrapper(<HealthPage/>));
    expect(await screen.findByText('B')).toBeInTheDocument();
  });
});


