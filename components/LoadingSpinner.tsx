// components/LoadingSpinner.tsx
import React from 'react';
import { Loader2 } from 'lucide-react'; // Using a simple icon

interface LoadingSpinnerProps {
  text?: string;
  size?: 'small' | 'medium' | 'large'; // NEW: Size prop
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  text = "Loading...", 
  size = "medium" 
}) => {
  // UPDATED: New size classes
  const spinnerSizeClass = 
    size === 'small' ? 'w-5 h-5' : 
    size === 'large' ? 'w-12 h-12' : // Made large a bit smaller
    'w-8 h-8'; // Default medium

  const textSizeClass =
    size === 'small' ? 'text-sm' :
    size === 'large' ? 'text-lg font-medium' :
    'text-base';
  
  const subTextSizeClass = 
    size === 'large' ? 'text-base' : 'text-sm';

  // Check if text includes the "seconds" part to split it
  const hasSubtext = text.includes("...");
  const mainText = hasSubtext ? text.split("...")[0] + "..." : text;
  const subText = hasSubtext ? text.split("...")[1] : null;

  return (
    <div className="flex flex-col items-center justify-center my-10 text-slate-600">
      <Loader2 className={`${spinnerSizeClass} text-indigo-600 animate-spin`} />
      <p className={`mt-4 ${textSizeClass}`}>{mainText}</p>
      {subText && (
        <p className={`mt-1 ${subTextSizeClass} text-slate-500`}>{subText}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;