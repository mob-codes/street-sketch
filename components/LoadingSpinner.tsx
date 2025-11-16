// components/LoadingSpinner.tsx
import React from 'react';
import { Loader2 } from 'lucide-react'; // Using a simple icon

interface LoadingSpinnerProps {
  mainText?: string; // UPDATED: Changed from 'text'
  subText?: string;  // NEW: Added subText prop
  size?: 'small' | 'medium' | 'large';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  mainText = "Loading...", 
  subText,
  size = "medium" 
}) => {
  const spinnerSizeClass = 
    size === 'small' ? 'w-5 h-5' : 
    size === 'large' ? 'w-12 h-12' : 
    'w-8 h-8';

  const textSizeClass =
    size === 'small' ? 'text-sm' :
    size === 'large' ? 'text-lg font-medium' :
    'text-base';
  
  const subTextSizeClass = 
    size === 'large' ? 'text-base' : 'text-sm';

  return (
    <div className="flex flex-col items-center justify-center my-10 text-slate-600">
      <Loader2 className={`${spinnerSizeClass} text-indigo-600 animate-spin`} />
      <p className={`mt-4 ${textSizeClass}`}>{mainText}</p>
      {/* NEW: Renders subText if it exists */}
      {subText && (
        <p className={`mt-1 ${subTextSizeClass} text-slate-500`}>{subText}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;