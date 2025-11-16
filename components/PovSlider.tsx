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

  // These classes are for styling the range input
  // They use CSS tricks to make the slider vertical, which Tailwind can't do alone
  const sliderClasses = isVertical
    ? "w-2 h-48 accent-indigo-600 [writing-mode:bt-lr] [-webkit-appearance:slider-vertical]"
    : "w-full h-2 accent-indigo-600";

  // These classes control the layout of the label, icon, and slider
  const containerClasses = isVertical
    ? "flex flex-col items-center h-64 justify-center"
    : "w-full";
  
  const labelContainerClasses = isVertical
    ? "flex flex-col items-center gap-1"
    : "flex items-center gap-1"; // Horizontal label

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