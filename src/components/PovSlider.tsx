// src/components/PovSlider.tsx
import React from 'react';

interface PovSliderProps {
  label: string;
  icon: React.ReactNode;
  value: number;
  displayValue?: string | number; // Value to show in the label
  unitLabel?: string;             // The symbol (e.g., ° or %)
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  orientation: 'horizontal' | 'vertical'; // Kept prop, but only 'horizontal' is used in App.tsx
}

const PovSlider: React.FC<PovSliderProps> = ({ 
  label, 
  icon, 
  value,
  displayValue,
  unitLabel = '°', // Default to degrees
  onChange, 
  min, 
  max, 
  step = 1, 
  orientation 
}) => {
  const isVertical = orientation === 'vertical';

  // UPDATED: Sliders are now always horizontal
  const sliderClasses = "w-full h-2 accent-indigo-600";
  
  const containerClasses = "w-full flex flex-col items-center";

  // Use the displayValue if provided, otherwise default to the actual value
  const valueToShow = displayValue !== undefined ? displayValue : value;

  return (
    <div className={containerClasses}>
      {/* UPDATED: Label is now always horizontal with icon */}
      <label htmlFor={label} className="block text-sm font-medium text-slate-700 mb-2">
        <span className="flex flex-row items-center justify-center gap-2">
          {icon}
          <span>{label}</span>
          <span className="text-slate-500 min-w-8 text-left">{valueToShow}{unitLabel}</span>
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
        // No vertical styles needed
      />
    </div>
  );
};

export default PovSlider;