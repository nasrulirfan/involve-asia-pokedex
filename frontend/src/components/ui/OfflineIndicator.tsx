'use client';

import React, { useState, useEffect } from 'react';
import { isOnline } from '@/lib/api';

interface OfflineIndicatorProps {
  className?: string;
  showWhenOnline?: boolean;
}

export default function OfflineIndicator({ 
  className = '', 
  showWhenOnline = false 
}: OfflineIndicatorProps) {
  const [isOffline, setIsOffline] = useState(false);
  const [, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    // Set initial state
    setIsOffline(!isOnline());

    const handleOnline = () => {
      if (isOffline) {
        setWasOffline(true);
        setShowReconnected(true);
        // Hide the "reconnected" message after 3 seconds
        setTimeout(() => setShowReconnected(false), 3000);
      }
      setIsOffline(false);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOffline]);

  // Show reconnected message
  if (showReconnected && showWhenOnline) {
    return (
      <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 ${className}`}>
        <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-slide-down">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">Back online!</span>
        </div>
      </div>
    );
  }

  // Don't show anything if online and not configured to show online status
  if (!isOffline && !showWhenOnline) {
    return null;
  }

  // Show offline indicator
  if (isOffline) {
    return (
      <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 ${className}`}>
        <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-slide-down">
          <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
          </svg>
          <span className="font-medium">You&apos;re offline</span>
          <span className="text-sm opacity-90">Some features may not work</span>
        </div>
      </div>
    );
  }

  return null;
}