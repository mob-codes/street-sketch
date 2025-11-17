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
  orientation: 'horizontal' | 'vertical';
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

  // UPDATED: Logic for inversion
  // For Tilt: min -90, max 90. Up (rtl) goes to max (90). This is "up is up".
  // For Zoom: min 10, max 120. Up (rtl) goes to max (120). This is "up is zoom out".
  const sliderStyle: React.CSSProperties = isVertical ? {
    writingMode: 'vertical-lr',
    direction: 'rtl' // "Up" on slider goes to MAX value
  } : {};

  // UPDATED: Classes are no longer responsive
  const sliderClasses = isVertical
    ? "w-2 h-48 accent-indigo-600"
    : "w-full h-2 accent-indigo-600";
  
  const containerClasses = "w-full flex flex-col items-center";

  // Use the displayValue if provided, otherwise default to the actual value
  const valueToShow = displayValue !== undefined ? displayValue : value;

  return (
    <div className={containerClasses}>
      <label htmlFor={label} className="block text-sm font-medium text-slate-700 mb-2">
        {/* UPDATED: Label is now always horizontal */}
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
        style={isVertical ? sliderStyle : {}} // Only apply style if vertical
      />
    </div>
  );
};

export default PovSlider;