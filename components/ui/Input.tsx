
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', id, ...props }) => {
  const inputId = id || props.name;
  
  return (
    <div className="mb-5">
      <label htmlFor={inputId} className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
        {label}
      </label>
      <input
        id={inputId}
        className={`appearance-none block w-full px-4 py-3 border rounded-md shadow-sm placeholder-[#9A9A9A] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base bg-[#F2F4F7] text-[#333333] transition-colors ${
          error ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500' : 'border-[#C6C6C6]'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600 font-medium">{error}</p>}
    </div>
  );
};
