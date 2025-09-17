import React from 'react';

const SummaryLoadingOverlay = ({ progress, estimatedTimeRemaining }) => {
  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '';
    if (seconds < 60) return `${seconds}s remaining`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s remaining`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="text-center mb-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            Generating Summary...
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {estimatedTimeRemaining !== null 
              ? `Estimated time remaining: ${formatTime(estimatedTimeRemaining)}`
              : 'Preparing...'}
          </p>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-2">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>0%</span>
          <span>{Math.min(100, Math.max(0, Math.round(progress)))}%</span>
          <span>100%</span>
        </div>
        
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
          This may take a moment. Please don't close this window.
        </p>
      </div>
    </div>
  );
};

export default SummaryLoadingOverlay;
