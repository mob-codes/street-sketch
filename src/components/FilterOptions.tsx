// components/FilterOptions.tsx
import React from 'react';

const ART_STYLES = [
    {
        name: 'Watercolor',
        thumbnail: '/example_watercolor.webp' //
    },
    {
        name: 'Oil Painting',
        thumbnail: '/example_oil_painting.webp' //
    },
    {
        name: 'Pencil Sketch',
        thumbnail: '/example_pencil_sketch.webp' //
    }
];

interface FilterOptionsProps {
  selectedStyle: string;
  onStyleChange: (style: string) => void;
  isLoading: boolean;
}

const FilterOptions: React.FC<FilterOptionsProps> = ({ selectedStyle, onStyleChange, isLoading }) => {
  return (
    <div className="pt-6 mt-6 border-t border-slate-200">
      <h3 className="text-md font-semibold text-center text-slate-600 mb-4">Choose your style</h3>
      <div className="grid grid-cols-3 gap-4">
        {ART_STYLES.map((style) => (
          <div key={style.name} className="flex flex-col items-center gap-2 text-center">
            <button
              type="button"
              onClick={() => onStyleChange(style.name)}
              disabled={isLoading}
              className={`
                w-full aspect-square rounded-lg border-2 
                transition-all duration-200 overflow-hidden
                ${selectedStyle === style.name ? 'border-indigo-600 ring-2 ring-indigo-500' : 'border-slate-200 hover:border-slate-400'}
                disabled:opacity-50
              `}
            >
              <img 
                src={style.thumbnail} 
                alt={`${style.name} style preview`} 
                className="w-full h-full object-cover"
              />
            </button>
            
            <button
              type="button"
              onClick={() => onStyleChange(style.name)}
              disabled={isLoading}
              className={`
                w-full px-3 py-2 rounded-full font-medium text-sm transition-all duration-200 border-2
                disabled:opacity-50 disabled:cursor-not-allowed
                ${
                  selectedStyle === style.name
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400'
                }
              `}
            >
              {style.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilterOptions;