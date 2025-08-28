"use client";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HealthRow } from '@/lib/types';
import { toNum } from '@/lib/format';
import { TrendingUp, Zap } from 'lucide-react';

interface PerformanceScoreChartProps {
  data: HealthRow[];
}

export function PerformanceScoreChart({ data }: PerformanceScoreChartProps) {
  // Create scatter plot data: Efficiency vs Safety Score
  const scatterData = data.map((machine) => ({
    name: machine.name,
    efficiency: toNum(machine.fuel_efficiency_score),
    safety: toNum(machine.safety_score),
    utilization: toNum(machine.utilization_ratio),
    manufacturer: machine.manufacturer,
    // Determine quadrant for color coding
    quadrant: toNum(machine.fuel_efficiency_score) >= 75 && toNum(machine.safety_score) >= 75 ? 'excellent' :
              toNum(machine.fuel_efficiency_score) >= 75 && toNum(machine.safety_score) < 75 ? 'efficient' :
              toNum(machine.fuel_efficiency_score) < 75 && toNum(machine.safety_score) >= 75 ? 'safe' : 'needs-attention'
  })).filter(item => item.efficiency > 0 && item.safety > 0);

  const getColor = (quadrant: string) => {
    switch (quadrant) {
      case 'excellent': return '#10b981'; // Green - High efficiency & safety
      case 'efficient': return '#3b82f6'; // Blue - High efficiency, lower safety
      case 'safe': return '#f59e0b'; // Orange - High safety, lower efficiency
      case 'needs-attention': return '#ef4444'; // Red - Both need improvement
      default: return '#6b7280';
    }
  };

  // Calculate quadrant counts
  const quadrantCounts = scatterData.reduce((acc, item) => {
    acc[item.quadrant] = (acc[item.quadrant] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const excellentCount = quadrantCounts['excellent'] || 0;
  const totalMachines = scatterData.length;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          Performance Matrix
        </CardTitle>
        <CardDescription>
          Fuel efficiency vs safety score correlation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Performance Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
              <div className="text-2xl font-bold text-green-600">{excellentCount}</div>
              <div className="text-xs text-green-600">Top Performers</div>
              <div className="text-[10px] text-gray-500">High Efficiency & Safety</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <div className="text-2xl font-bold text-blue-600">{((excellentCount / totalMachines) * 100).toFixed(0)}%</div>
              <div className="text-xs text-blue-600">Elite Fleet</div>
              <div className="text-[10px] text-gray-500">Performance Excellence</div>
            </div>
          </div>

          {/* Scatter Plot */}
          <ResponsiveContainer width="100%" height={250}>
            <ScatterChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="efficiency"
                domain={[0, 100]}
                fontSize={11}
                label={{ value: 'Fuel Efficiency Score', position: 'insideBottom', offset: -5, fontSize: 10 }}
              />
              <YAxis 
                dataKey="safety"
                domain={[0, 100]}
                fontSize={11}
                label={{ value: 'Safety Score', angle: -90, position: 'insideLeft', fontSize: 10 }}
              />
              
              {/* Reference lines for quadrants */}
              <ReferenceLine x={75} stroke="#94a3b8" strokeDasharray="2 2" />
              <ReferenceLine y={75} stroke="#94a3b8" strokeDasharray="2 2" />
              
              <Tooltip 
                formatter={(value, name, props) => [
                  name === 'efficiency' ? `${value}% Efficiency` : `${value}% Safety`,
                  ''
                ]}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    const data = payload[0].payload;
                    return `${data.name} (${data.manufacturer})`;
                  }
                  return '';
                }}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              
              <Scatter 
                data={scatterData} 
                fill="#3b82f6"
              >
                {scatterData.map((entry, index) => (
                  <circle 
                    key={`cell-${index}`} 
                    fill={getColor(entry.quadrant)}
                    r={Math.max(3, entry.utilization / 10)} // Size based on utilization
                    opacity={0.7}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Excellent (High Eff. & Safety)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Efficient (High Eff.)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>Safe (High Safety)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Needs Attention</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
