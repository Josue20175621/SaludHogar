import React from 'react';

interface DaySelectorProps {
  selectedDays: number[];
  onChange: (days: number[]) => void;
}

const DAYS = [
  { label: 'L', value: 0, name: 'Lunes' },
  { label: 'M', value: 1, name: 'Martes' },
  { label: 'M', value: 2, name: 'Miércoles' },
  { label: 'J', value: 3, name: 'Jueves' },
  { label: 'V', value: 4, name: 'Viernes' },
  { label: 'S', value: 5, name: 'Sábado' },
  { label: 'D', value: 6, name: 'Domingo' },
];

export const DaySelector: React.FC<DaySelectorProps> = ({ selectedDays, onChange }) => {
  
  const toggleDay = (dayValue: number) => {
    if (selectedDays.includes(dayValue)) {
      // Remove day
      onChange(selectedDays.filter(d => d !== dayValue));
    } else {
      // Add day and sort
      onChange([...selectedDays, dayValue].sort((a, b) => a - b));
    }
  };

  const isEveryDay = selectedDays.length === 0 || selectedDays.length === 7;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Días de toma
      </label>
      <div className="flex gap-2 flex-wrap">
        {DAYS.map((day) => {
          const isSelected = selectedDays.includes(day.value);
          return (
            <button
              key={day.value}
              type="button"
              onClick={() => toggleDay(day.value)}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                ${isSelected 
                  ? 'bg-purple-600 text-white shadow-md transform scale-105' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              title={day.name}
            >
              {day.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {isEveryDay 
          ? "Se enviarán recordatorios todos los días." 
          : "Solo se enviarán recordatorios los días seleccionados."}
      </p>
    </div>
  );
};