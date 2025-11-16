// components/PovSlider.tsx
import React from 'react';

interface PovSliderProps {
  label: string;
  icon: React.ReactNode;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  orientation: 'horizontal' | 'vertical';
}

const PovSlider: React.FC<PovSliderProps> = ({ 
  label, 
  icon, 
  value, 
  onChange, 
  min, 
  max, 
  step = 1, 
  orientation 
}) => {
  const isVertical = orientation === 'vertical';

  const sliderClasses = isVertical
    // These classes use CSS to make the slider vertical
    ? "w-2 h-48 accent-indigo-600 [writing-mode:bt-lr] [-webkit-appearance:slider-vertical]"
    : "w-full h-2 accent-indigo-600";

  // UPDATED: Adjusted container classes for better vertical alignment
  const containerClasses = isVertical
    ? "flex flex-col items-center justify-start h-full"
    : "w-full";
  
  const labelContainerClasses = isVertical
    ? "flex flex-col items-center gap-1"
    : "flex items-center gap-1";

  return (
    <div className={containerClasses}>
      <label htmlFor={label} className="block text-sm font-medium text-slate-700 mb-2">
        <span className={labelContainerClasses}>
          {icon}
          <span>{label} ({value}°)</span>
        </span>
      </label>
      <input
        type="range"
        id={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={sliderClasses}
      />
    </div>
  );
};

export default PovSlider;