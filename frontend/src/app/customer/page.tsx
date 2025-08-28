"use client";
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useCustomerRealTime } from '@/hooks/useRealTimeData';
import { 
  Building2, 
  TrendingUp, 
  CreditCard, 
  Truck, 
  Calendar,
  MapPin,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function CustomerDashboard() {
  const { user } = useAuth();

  // Enable real-time data updates
  useCustomerRealTime(user?.company_id);

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['customerDashboard', user?.company_id],
    queryFn: () => user?.company_id ? api.getCustomerDashboard(user.company_id) : null,
    enabled: !!user?.company_id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const contractData = Object.entries(dashboardData.contractSummary).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value: value
  }));

  const pieColors = ['#10b981', '#f59e0b', '#ef4444'];

  const machineTypes = dashboardData.activeMachines.reduce((acc: any, machine) => {
    acc[machine.asset_type] = (acc[machine.asset_type] || 0) + 1;
    return acc;
  }, {});

  const machineChartData = Object.entries(machineTypes).map(([type, count]) => ({
    type,
    count
  }));

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-black border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Welcome back, {user?.username}!</h1>
              <p className="text-gray-400 mt-2">
                {dashboardData.companyInfo.name} • {dashboardData.companyInfo.industry}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Company</div>
              <div className="text-xl font-semibold text-white">{dashboardData.companyInfo.name}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-900/50 rounded-lg">
                <Truck className="h-8 w-8 text-blue-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-white">
                  {dashboardData.activeMachineCount}
                </div>
                <div className="text-sm text-gray-400">Active Machines</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-900/50 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-white">
                  {dashboardData.contractSummary.active}
                </div>
                <div className="text-sm text-gray-400">Active Contracts</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-900/50 rounded-lg">
                <DollarSign className="h-8 w-8 text-purple-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-white">
                  ₹{dashboardData.financials.totalBilledAmount.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">Total Billed</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-900/50 rounded-lg">
                <Clock className="h-8 w-8 text-orange-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-white">
                  {dashboardData.financials.pendingInvoices}
                </div>
                <div className="text-sm text-gray-400">Pending Payments</div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Contract Status Chart */}
          <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-700 p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Contract Status</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={contractData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {contractData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-4 mt-4">
              {contractData.map((entry, index) => (
                <div key={entry.name} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: pieColors[index % pieColors.length] }}
                  ></div>
                  <span className="text-sm text-gray-300">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Machine Types Chart */}
          <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-700 p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Active Equipment Types</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={machineChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="type" 
                    stroke="#9ca3af"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Company Information */}
        <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-700 p-6 mb-8">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Building2 className="h-6 w-6 mr-2 text-blue-400" />
            Company Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-gray-400">Industry</div>
              <div className="text-white font-medium">{dashboardData.companyInfo.industry}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">State</div>
              <div className="text-white font-medium">{dashboardData.companyInfo.state}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Segment</div>
              <div className="text-white font-medium">{dashboardData.companyInfo.segment}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Address</div>
              <div className="text-white font-medium">{dashboardData.companyInfo.address}</div>
            </div>
          </div>
        </div>

        {/* Active Equipment */}
        <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-700 p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Settings className="h-6 w-6 mr-2 text-green-400" />
            Active Equipment
          </h3>
          
          {dashboardData.activeMachines.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-3 text-gray-300">Machine ID</th>
                    <th className="text-left p-3 text-gray-300">Type</th>
                    <th className="text-left p-3 text-gray-300">Manufacturer</th>
                    <th className="text-left p-3 text-gray-300">Contract End Date</th>
                    <th className="text-left p-3 text-gray-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.activeMachines.map((machine) => {
                    const endDate = new Date(machine.end_date);
                    const daysLeft = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    const isExpiringSoon = daysLeft <= 7;
                    
                    return (
                      <tr key={machine.machine_id} className="border-b border-gray-800 hover:bg-gray-800/50">
                        <td className="p-3 text-white font-medium">#{machine.machine_id}</td>
                        <td className="p-3 text-gray-300">{machine.asset_type}</td>
                        <td className="p-3 text-gray-300">{machine.manufacturer}</td>
                        <td className="p-3 text-gray-300">
                          {endDate.toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          {isExpiringSoon ? (
                            <span className="px-2 py-1 bg-red-900/30 text-red-300 rounded-full text-xs">
                              Expires in {daysLeft} days
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-green-900/30 text-green-300 rounded-full text-xs">
                              Active
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Truck className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No active equipment rentals</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
