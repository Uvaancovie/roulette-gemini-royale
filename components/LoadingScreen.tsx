import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = "Loading Covies Casino..."
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-felt-900">
      <div className="text-center">
        {/* Animated Logo */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-tr from-yellow-400 to-yellow-600 rounded-full shadow-lg shadow-yellow-500/20 flex items-center justify-center animate-pulse">
            <span className="text-4xl">🎰</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500 tracking-widest uppercase">
            Covies Casino
          </h1>
        </div>

        {/* Loading Message */}
        <p className="text-gray-400 text-sm md:text-base animate-pulse">
          {message}
        </p>

        {/* Loading Spinner */}
        <div className="mt-6 flex justify-center">
          <div className="w-8 h-8 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin"></div>
        </div>

        {/* Progress Dots */}
        <div className="mt-4 flex justify-center space-x-1">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};