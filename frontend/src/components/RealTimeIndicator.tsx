"use client";
import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RotateCcw } from 'lucide-react';

interface RealTimeIndicatorProps {
  intervalMs?: number;
  className?: string;
}

export function RealTimeIndicator({ intervalMs = 30000, className = "" }: RealTimeIndicatorProps) {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [timeUntilNext, setTimeUntilNext] = useState<number>(intervalMs);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUntilNext(prev => {
        if (prev <= 1000) {
          setIsUpdating(true);
          setLastUpdate(new Date());
          setTimeout(() => setIsUpdating(false), 2000); // Show updating for 2 seconds
          return intervalMs;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [intervalMs]);

  const secondsUntilNext = Math.ceil(timeUntilNext / 1000);

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      {isUpdating ? (
        <>
          <RotateCcw className="h-4 w-4 text-blue-400 animate-spin" />
          <span className="text-blue-400">Updating...</span>
        </>
      ) : (
        <>
          <Wifi className="h-4 w-4 text-green-400" />
          <span className="text-gray-400">
            Next update in {secondsUntilNext}s
          </span>
        </>
      )}
      
      <span className="text-xs text-gray-500">
        Last: {lastUpdate.toLocaleTimeString()}
      </span>
    </div>
  );
}
