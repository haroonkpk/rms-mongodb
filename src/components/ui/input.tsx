"use client";

import React, { InputHTMLAttributes, forwardRef, useState } from "react";
import { Eye, EyeOff, Calendar } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      id,
      className = "",
      type,
      value,
      onChange,
      readOnly,
      error,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [internalDateVal, setInternalDateVal] = useState(() => {
      if (typeof value === "string") return value;
      if (typeof props.defaultValue === "string") return props.defaultValue;
      return "";
    });

    if (type === "date") {
      const currentVal = typeof value === "string" ? value : internalDateVal;

      const formatDateDDMMYYYY = (val: string) => {
        if (!val) return "";
        const parts = val.split("-");
        if (parts.length === 3) {
          return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return val;
      };

      const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInternalDateVal(e.target.value);
        if (onChange) {
          onChange(e);
        }
      };

      const dateInputProps: InputHTMLAttributes<HTMLInputElement> = {
        ...props,
      };
      if (value !== undefined) {
        dateInputProps.value = value;
      }

      const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
        if (typeof e.currentTarget.showPicker === "function") {
          try {
            e.currentTarget.showPicker();
          } catch {
            // ignore if picker is already open
          }
        }
      };

      return (
        <div className="flex flex-col gap-[clamp(0.3rem,1vw,0.5rem)] w-full relative">
          {label && (
            <label
              htmlFor={id}
              className="text-[clamp(0.7rem,1vw,0.8rem)] font-bold text-[#475569] uppercase tracking-wide"
            >
              {label}
              {props.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}

          <div className="relative group cursor-pointer">
            <input
              type="text"
              readOnly
              tabIndex={-1}
              value={formatDateDDMMYYYY(currentVal)}
              placeholder="dd/mm/yyyy"
              className={`
                w-full bg-[var(--color-page-bg)] text-[#1E293B] placeholder-[#94A3B8]
                outline-none transition-all duration-200 border border-transparent
                focus:border-[var(--color-primary)] focus:bg-white focus:shadow-sm
                p-[clamp(0.6rem,1.5vw,0.875rem)]
                text-[clamp(0.875rem,1vw+0.2rem,1rem)]
                pr-10 cursor-pointer font-medium pointer-events-none
                ${error ? "border-red-400 focus:border-red-400" : ""}
                ${className}
              `}
            />
            <input
              ref={ref}
              id={id}
              type="date"
              onClick={handleInputClick}
              onChange={handleDateChange}
              readOnly={readOnly || (!onChange && value !== undefined)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              {...dateInputProps}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#94A3B8] group-hover:text-[#475569] transition-colors z-20">
              <Calendar size={18} />
            </div>
          </div>
          {error && (
            <p className="text-[clamp(0.8rem,1vw,0.875rem)] font-medium text-red-500">
              {error}
            </p>
          )}
        </div>
      );
    }

    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
      <div className="flex flex-col gap-[clamp(0.3rem,1vw,0.5rem)] w-full relative">
        {label && (
          <label
            htmlFor={id}
            className="text-[clamp(0.7rem,1vw,0.8rem)] font-bold text-[#475569] uppercase tracking-wide"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative group">
          <input
            ref={ref}
            id={id}
            type={inputType}
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            className={`
              w-full bg-[var(--color-page-bg)] text-[#1E293B] placeholder-[#94A3B8]
               outline-none transition-all duration-200 border border-transparent
              focus:border-[var(--color-primary)] focus:bg-white focus:shadow-sm
              p-[clamp(0.6rem,1.5vw,0.875rem)]
              text-[clamp(0.875rem,1vw+0.2rem,1rem)]
              ${isPassword ? "pr-10" : ""}
              ${error ? "border-red-400 focus:border-red-400" : ""}
              ${className}
            `}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] transition-colors p-1 hover:bg-slate-100"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        {error && (
          <p className="text-[clamp(0.8rem,1vw,0.875rem)] font-medium text-red-500">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
