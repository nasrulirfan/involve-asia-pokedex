import React from 'react';
import { ApiError } from '@/lib/api';

interface ErrorMessageProps {
  error?: ApiError | Error | string;
  message?: string;
  onRetry?: () => void;
  className?: string;
  variant?: 'inline' | 'card' | 'banner';
  showDetails?: boolean;
}

export default function ErrorMessage({ 
  error, 
  message, 
  onRetry, 
  className = '', 
  variant = 'inline',
  showDetails = false
}: ErrorMessageProps) {
  // Determine error message and type
  let errorMessage = message;
  let errorType: 'network' | 'timeout' | 'server' | 'client' | 'unknown' = 'unknown';
  let canRetry = true;

  if (error) {
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error instanceof Error) {
      const apiError = error as ApiError;
      errorMessage = apiError.message;
      
      if (apiError.isNetworkError) {
        errorType = 'network';
      } else if (apiError.isTimeoutError) {
        errorType = 'timeout';
      } else if (apiError.status) {
        if (apiError.status >= 400 && apiError.status < 500) {
          errorType = 'client';
          canRetry = false; // Don't retry client errors
        } else if (apiError.status >= 500) {
          errorType = 'server';
        }
      }
    }
  }

  // Get appropriate icon and colors based on error type
  const getErrorConfig = () => {
    switch (errorType) {
      case 'network':
        return {
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
            </svg>
          ),
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-800',
          iconColor: 'text-orange-400',
          buttonBg: 'bg-orange-100 hover:bg-orange-200',
          buttonText: 'text-orange-800',
        };
      case 'timeout':
        return {
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-400',
          buttonBg: 'bg-yellow-100 hover:bg-yellow-200',
          buttonText: 'text-yellow-800',
        };
      case 'server':
        return {
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-400',
          buttonBg: 'bg-red-100 hover:bg-red-200',
          buttonText: 'text-red-800',
        };
      case 'client':
        return {
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ),
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-400',
          buttonBg: 'bg-blue-100 hover:bg-blue-200',
          buttonText: 'text-blue-800',
        };
      default:
        return {
          icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          ),
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-400',
          buttonBg: 'bg-red-100 hover:bg-red-200',
          buttonText: 'text-red-800',
        };
    }
  };

  const config = getErrorConfig();

  // Get user-friendly error messages
  const getUserFriendlyMessage = () => {
    switch (errorType) {
      case 'network':
        return 'Unable to connect to the server. Please check your internet connection.';
      case 'timeout':
        return 'The request took too long to complete. Please try again.';
      case 'server':
        return 'The server is experiencing issues. Please try again in a few moments.';
      case 'client':
        return errorMessage || 'There was an issue with your request.';
      default:
        return errorMessage || 'An unexpected error occurred.';
    }
  };

  const renderContent = () => (
    <>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className={config.iconColor}>
            {config.icon}
          </div>
        </div>
        <div className="ml-3 flex-1">
          <p className={`text-sm font-medium ${config.textColor}`}>
            {getUserFriendlyMessage()}
          </p>
          {showDetails && error && typeof error !== 'string' && (
            <p className={`text-xs mt-1 ${config.textColor} opacity-75`}>
              {error.message}
            </p>
          )}
        </div>
        {onRetry && canRetry && (
          <div className="ml-4">
            <button
              onClick={onRetry}
              className={`${config.buttonBg} ${config.buttonText} px-3 py-1 rounded text-sm font-medium transition-colors`}
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </>
  );

  // Render based on variant
  switch (variant) {
    case 'card':
      return (
        <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-6 text-center ${className}`}>
          <div className="flex flex-col items-center">
            <div className={`${config.iconColor} mb-4`}>
              {React.cloneElement(config.icon, { className: 'w-12 h-12' })}
            </div>
            <h3 className={`text-lg font-semibold ${config.textColor} mb-2`}>
              {errorType === 'network' ? 'Connection Problem' : 
               errorType === 'timeout' ? 'Request Timeout' :
               errorType === 'server' ? 'Server Error' :
               errorType === 'client' ? 'Request Error' : 'Error'}
            </h3>
            <p className={`${config.textColor} mb-4`}>
              {getUserFriendlyMessage()}
            </p>
            {onRetry && canRetry && (
              <button
                onClick={onRetry}
                className={`${config.buttonBg} ${config.buttonText} px-4 py-2 rounded-lg font-medium transition-colors`}
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      );
    
    case 'banner':
      return (
        <div className={`${config.bgColor} ${config.borderColor} border-l-4 p-4 ${className}`}>
          {renderContent()}
        </div>
      );
    
    default: // inline
      return (
        <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 ${className}`}>
          {renderContent()}
        </div>
      );
  }
}