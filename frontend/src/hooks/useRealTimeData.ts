"use client";
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Custom hook for real-time data updates
 * Automatically refreshes React Query data at specified intervals
 */
export function useRealTimeData(queryKeys: string[], intervalMs: number = 30000) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Initial log
    console.log(`🔄 Starting real-time updates for queries: ${queryKeys.join(', ')}`);
    console.log(`⏱️  Update interval: ${intervalMs / 1000} seconds`);

    const interval = setInterval(async () => {
      console.log(`🔄 [${new Date().toLocaleTimeString()}] Refreshing real-time data...`);
      
      // Invalidate and refetch specified queries
      for (const queryKey of queryKeys) {
        await queryClient.invalidateQueries({ queryKey: [queryKey] });
      }
      
      console.log(`✅ Real-time data refresh complete`);
    }, intervalMs);

    // Cleanup interval on unmount
    return () => {
      console.log('🛑 Stopping real-time updates');
      clearInterval(interval);
    };
  }, [queryClient, queryKeys, intervalMs]);
}

/**
 * Pre-configured hooks for different pages
 */

// For main dashboard (every 30 seconds)
export function useDashboardRealTime() {
  return useRealTimeData(['assets', 'dashboard-analytics'], 30000);
}

// For usage page (every 30 seconds - matches simulation interval)
export function useUsageRealTime() {
  return useRealTimeData(['usageAnalytics', 'usage'], 30000);
}

// For health page (every 30 seconds)
export function useHealthRealTime() {
  return useRealTimeData(['health'], 30000);
}

// For customer dashboard (every 60 seconds - less frequent for customer view)
export function useCustomerRealTime(companyId?: number) {
  return useRealTimeData(
    companyId ? ['customerDashboard'] : [], 
    60000
  );
}

// For individual machine health (every 15 seconds - more frequent for detailed view)
export function useMachineDetailRealTime(machineId?: string) {
  return useRealTimeData(
    machineId ? [`machine-health-${machineId}`] : [], 
    15000
  );
}
