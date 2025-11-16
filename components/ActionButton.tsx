
import React from 'react';

interface ActionButtonProps {
  onClick: () => void;
  text: string;
  icon: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, text, icon, className = '', disabled = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center justify-center w-full sm:w-auto
        px-6 py-3 text-white font-semibold rounded-lg shadow-md
        transition-all duration-200 transform hover:scale-105
        disabled:bg-slate-400 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {icon}
      {text}
    </button>
  );
};

export default ActionButton;
