// src/components/PovSlider.tsx
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

  const sliderStyle: React.CSSProperties = isVertical ? {
    writingMode: 'vertical-lr', // 'vertical-lr' is 'vertical, left-to-right'
    direction: 'rtl' // This makes the slider go bottom-to-top
  } : {};

  const sliderClasses = isVertical
    ? "w-2 h-48 accent-indigo-600"
    : "w-full h-2 accent-indigo-600";
  
  const containerClasses = isVertical
    ? "flex flex-col items-center justify-start h-full"
    : "w-full flex flex-col items-center"; // UPDATED: Added flex for horizontal centering

  return (
    <div className={containerClasses}>
      <label htmlFor={label} className="block text-sm font-medium text-slate-700 mb-2">
        {/* UPDATED: New conditional layout for labels */}
        {isVertical ? (
          <span className="flex flex-col items-center gap-1">
            {icon}
            <span>{label}</span>
            <span className="text-slate-500">{value}°</span>
          </span>
        ) : (
          <span className="flex flex-col items-center gap-1">
            <span>{label}</span>
            <span className="text-slate-500">{value}°</span>
          </span>
        )}
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
        style={sliderStyle}
      />
    </div>
  );
};

export default PovSlider;