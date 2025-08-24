"use client";

import { TbArrowRight } from "react-icons/tb";

interface DraggableSliderProps {
  isSliderActive: boolean;
  sliderPosition: number;
  sliderRef: React.RefObject<HTMLDivElement>;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
}

export default function DraggableSlider({
  isSliderActive,
  sliderPosition,
  sliderRef,
  onMouseDown,
  onTouchStart
}: DraggableSliderProps) {
  return (
    <div className="p-6">
      <div 
        ref={sliderRef}
        className="relative w-full h-16 bg-custom-bg-shadow-dark rounded-3xl shadow-neuro-dark-inset overflow-hidden"
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        {/* Slider Track */}
        <div className="absolute inset-0 bg-custom-bg-dark rounded-3xl" />
        
        {/* Progress Bar */}
        <div 
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-600 to-emerald-700 transition-all duration-200 ease-out"
          style={{ width: `${sliderPosition}%` }}
        />
        
        {/* Slider Button */}
        <div 
          className="absolute top-2 w-12 h-12 bg-custom-bg-light rounded-2xl shadow-neuro-dark-outset flex items-center justify-center cursor-pointer transition-all duration-200 ease-out hover:shadow-neuro-dark-pressed"
          style={{ left: `max(0px, calc(${sliderPosition}% - 24px))` }}
        >
          <TbArrowRight className="w-6 h-6 text-emerald-400" />
        </div>
        
        {/* Slider Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-emerald-400 text-sm font-medium">
            {isSliderActive ? "Processing..." : "Slide to pay"}
          </span>
        </div>
      </div>
    </div>
  );
}
