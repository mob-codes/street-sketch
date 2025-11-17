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

  // UPDATED: Responsive classes
  // If vertical: horizontal by default, vertical on 'md' screens
  // If horizontal: always horizontal
  const sliderClasses = isVertical
    ? "w-full h-2 accent-indigo-600 md:w-2 md:h-48 md:[writing-mode:vertical-lr] md:dir-rtl"
    : "w-full h-2 accent-indigo-600";
  
  // UPDATED: Responsive classes
  // If vertical: full-width on mobile, 'h-full' on desktop
  const containerClasses = isVertical
    ? "flex flex-col items-center justify-start w-full md:h-full"
    : "w-full flex flex-col items-center";

  // Use the displayValue if provided, otherwise default to the actual value
  const valueToShow = displayValue !== undefined ? displayValue : value;

  // UPDATED: Label container is different for vertical orientation on mobile
  const labelContainerClasses = isVertical
    ? "flex flex-row items-center justify-center gap-2 md:flex-col md:gap-1"
    : "flex flex-col items-center gap-1";

  // UPDATED: Logic to show icon and text side-by-side on mobile for vertical sliders
  const labelContent = isVertical ? (
    <span className={labelContainerClasses}>
      <span className="flex md:flex-col items-center gap-1">
        {icon}
        <span>{label}</span>
      </span>
      <span className="text-slate-500">{valueToShow}{unitLabel}</span>
    </span>
  ) : (
    <span className={labelContainerClasses}>
      <span>{label}</span>
      <span className="text-slate-500">{valueToShow}{unitLabel}</span>
    </span>
  );

  return (
    <div className={containerClasses}>
      <label htmlFor={label} className="block text-sm font-medium text-slate-700 mb-2">
        {labelContent}
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