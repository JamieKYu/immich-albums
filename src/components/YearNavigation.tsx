"use client";
import { useState, useEffect, useRef } from "react";

interface YearNavigationProps {
  years: string[];
  onYearSelect: (year: string) => void;
  yearRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
}

export default function YearNavigation({ years, onYearSelect, yearRefs }: YearNavigationProps) {
  const [selectedYear, setSelectedYear] = useState<string>(years[0] || "");
  const [sliderValue, setSliderValue] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedYear(years[0] || "");
    setSliderValue(0);
  }, [years]);

  // Scroll detection to update slider position
  useEffect(() => {
    const handleScroll = () => {
      if (isDragging) return; // Don't update while user is dragging
      
      let visibleYear = years[0];
      let minDistance = Infinity;
      
      years.forEach((year) => {
        const element = yearRefs.current[year];
        if (element) {
          const rect = element.getBoundingClientRect();
          const distance = Math.abs(rect.top);
          
          if (distance < minDistance) {
            minDistance = distance;
            visibleYear = year;
          }
        }
      });
      
      const newIndex = years.indexOf(visibleYear);
      if (newIndex !== -1 && newIndex !== sliderValue) {
        setSliderValue(newIndex);
        setSelectedYear(visibleYear);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [years, yearRefs, sliderValue, isDragging]);

  const handleYearClick = (year: string, index: number) => {
    setSelectedYear(year);
    setSliderValue(index);
    onYearSelect(year);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateSliderFromMouse(e);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      updateSliderFromMouse(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateSliderFromMouse = (e: MouseEvent | React.MouseEvent) => {
    if (!sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const percentage = Math.max(0, Math.min(1, y / rect.height));
    const index = Math.round(percentage * (years.length - 1));
    
    setSliderValue(index);
    const year = years[index];
    setSelectedYear(year);
    onYearSelect(year);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, years, onYearSelect]);

  if (years.length <= 1) return null;

  const thumbPosition = (sliderValue / (years.length - 1)) * 100;

  return (
    <div className="fixed right-0 top-0 h-screen z-10 pr-16 hidden md:block">
      <div className="h-full flex items-center">
        <div className="flex flex-col items-center space-y-4 h-5/6">
          {/* Custom vertical slider */}
          <div className="relative flex-1 flex items-center">
            <div 
              ref={sliderRef}
              className="relative h-full w-1 bg-gray-300 rounded-sm cursor-pointer"
              onMouseDown={handleMouseDown}
            >
              {/* Slider thumb */}
              <div
                className="absolute w-4 h-4 bg-gray-700 border-2 border-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                style={{
                  left: '50%',
                  top: `${thumbPosition}%`
                }}
              />
            </div>
            
            {/* Tick marks and Year labels combined */}
            <div className="absolute left-2 top-0 h-full flex flex-col justify-between">
              {years.map((year, index) => (
                <button
                  key={year}
                  onClick={() => handleYearClick(year, index)}
                  className="flex items-center space-x-2 transition-all duration-200 hover:scale-110 cursor-pointer"
                >
                  {/* Tick mark */}
                  <div className="w-2 h-0.5 bg-gray-600" />
                  {/* Year label */}
                  <span className={`text-sm font-medium ${
                    selectedYear === year 
                      ? 'text-black font-bold' 
                      : 'text-gray-600 hover:text-black'
                  }`}>
                    {year}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}