"use client";
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Loader from '@/components/Loader';
import ErrorState from '@/components/ErrorState';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Calendar, MapPin, Package } from 'lucide-react';

export default function ForecastPage() {
  const { 
    data: forecastData, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['forecast'],
    queryFn: api.getForecast
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black">
        <ErrorState error="Failed to load forecast data" />
      </div>
    );
  }

  // Simple forecast data processing
  const chartData = forecastData?.map((item: any) => ({
    month: item.month,
    rentals: Number(item.rentals) || 0
  })) || [];

  // Generate equipment demand predictions (mock data for demo)
  const equipmentDemand = [
    { equipment: 'Excavator', current: 45, predicted: 62, site: 'Mumbai Construction' },
    { equipment: 'Crane', current: 23, predicted: 31, site: 'Delhi Metro Project' },
    { equipment: 'Bulldozer', current: 18, predicted: 24, site: 'Bangalore Highway' },
    { equipment: 'Loader', current: 34, predicted: 28, site: 'Chennai Port' },
    { equipment: 'Generator', current: 67, predicted: 78, site: 'Pune IT Park' },
    { equipment: 'Compactor', current: 12, predicted: 19, site: 'Hyderabad Airport' }
  ];

  const totalCurrent = equipmentDemand.reduce((sum, item) => sum + item.current, 0);
  const totalPredicted = equipmentDemand.reduce((sum, item) => sum + item.predicted, 0);
  const growthRate = totalCurrent > 0 ? ((totalPredicted - totalCurrent) / totalCurrent * 100) : 0;

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              Demand Forecasting
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Predict equipment demand to help pre-position tools and machines at the right sites and times
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-gray-400 mr-3" />
              <div>
                <div className="text-2xl font-bold text-white">{totalCurrent}</div>
                <div className="text-sm text-gray-400">Current Demand</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-gray-400 mr-3" />
              <div>
                <div className="text-2xl font-bold text-white">{totalPredicted}</div>
                <div className="text-sm text-gray-400">Predicted Demand</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-gray-400 mr-3" />
              <div>
                <div className="text-2xl font-bold text-white">
                  {growthRate > 0 ? '+' : ''}{growthRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-400">Growth Rate</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-gray-400 mr-3" />
              <div>
                <div className="text-2xl font-bold text-white">{equipmentDemand.length}</div>
                <div className="text-sm text-gray-400">Active Sites</div>
              </div>
            </div>
          </div>
        </div>

        {/* Historical Trend */}
        <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Historical Rental Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="month" 
                  stroke="#9ca3af"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#9ca3af"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    color: '#fff'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="rentals" 
                  stroke="#6b7280" 
                  strokeWidth={2}
                  dot={{ fill: '#6b7280', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Equipment Demand Forecast */}
        <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Equipment Demand Prediction</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={equipmentDemand}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="equipment" 
                  stroke="#9ca3af"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#9ca3af"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    color: '#fff'
                  }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = equipmentDemand.find(item => item.equipment === label);
                      return (
                        <div className="bg-gray-800 p-3 border border-gray-600 rounded">
                          <p className="font-medium text-white mb-2">{label}</p>
                          <p className="text-sm text-gray-300">Site: {data?.site}</p>
                          <p className="text-sm text-gray-300">Current: {data?.current} units</p>
                          <p className="text-sm text-gray-300">Predicted: {data?.predicted} units</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="current" fill="#4b5563" name="Current Demand" />
                <Bar dataKey="predicted" fill="#6b7280" name="Predicted Demand" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Forecast Table */}
        <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Site-wise Equipment Forecast</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-3 text-gray-300">Equipment Type</th>
                  <th className="text-left p-3 text-gray-300">Site Location</th>
                  <th className="text-left p-3 text-gray-300">Current Demand</th>
                  <th className="text-left p-3 text-gray-300">Predicted Demand</th>
                  <th className="text-left p-3 text-gray-300">Change</th>
                  <th className="text-left p-3 text-gray-300">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {equipmentDemand.map((item, index) => {
                  const change = item.predicted - item.current;
                  const changePercent = item.current > 0 ? (change / item.current * 100) : 0;
                  
                  return (
                    <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-3 text-white font-medium">{item.equipment}</td>
                      <td className="p-3 text-gray-300">{item.site}</td>
                      <td className="p-3 text-gray-300">{item.current} units</td>
                      <td className="p-3 text-gray-300">{item.predicted} units</td>
                      <td className="p-3">
                        <span className={`font-medium ${
                          change > 0 ? 'text-white' : 
                          change < 0 ? 'text-gray-400' : 'text-gray-300'
                        }`}>
                          {change > 0 ? '+' : ''}{change} ({changePercent.toFixed(1)}%)
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          change > 5 ? 'bg-gray-700 text-white' :
                          change < -5 ? 'bg-gray-800 text-gray-400' :
                          'bg-gray-800 text-gray-300'
                        }`}>
                          {change > 5 ? 'Increase Stock' : 
                           change < -5 ? 'Reduce Stock' : 
                           'Maintain Current'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Forecast Summary */}
        <div className="mt-8 bg-gray-900 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Forecast Summary</h3>
          <div className="space-y-3 text-gray-300">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
              <span>Overall equipment demand is expected to increase by {growthRate.toFixed(1)}%</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
              <span>Excavators and Generators show highest growth potential</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
              <span>Consider pre-positioning equipment at Mumbai and Pune sites</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
              <span>Monitor Chennai site for potential demand reduction</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}