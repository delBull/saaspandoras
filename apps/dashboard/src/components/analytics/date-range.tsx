"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

interface DateRangePickerProps {
  value?: { from: Date; to: Date };
  onChange: (range?: { from: Date; to: Date }) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatDate = (date: Date) => {
    return format(date, "dd MMM yyyy", { locale: es });
  };

  const handleDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [start, end] = e.target.value.split(" to ");

    if (start && end) {
      const range = {
        from: new Date(start),
        to: new Date(end),
      };
      onChange(range);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white hover:bg-gray-50 text-gray-700"
      >
        <CalendarIcon size={16} />
        {value?.from && value?.to ? (
          `${formatDate(value.from)} - ${formatDate(value.to)}`
        ) : (
          "Seleccionar rango"
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 p-4 bg-white border rounded-lg shadow-lg z-10 w-80">
          <input
            type="text"
            placeholder="Seleccione rango de fechas"
            onChange={handleDateSelect}
            className="w-full p-2 border rounded"
          />
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => {
                const now = new Date();
                onChange({
                  from: new Date(now.setHours(0, 0, 0, 0)),
                  to: new Date(now.setHours(23, 59, 59, 999)),
                });
                setIsOpen(false);
              }}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              Hoy
            </button>
            <button
              onClick={() => {
                const now = new Date();
                onChange({
                  from: new Date(now.setDate(now.getDate() - 7)),
                  to: new Date(),
                });
                setIsOpen(false);
              }}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              7 días
            </button>
            <button
              onClick={() => {
                const now = new Date();
                onChange({
                  from: new Date(now.setDate(now.getDate() - 30)),
                  to: new Date(),
                });
                setIsOpen(false);
              }}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              30 días
            </button>
            <button
              onClick={() => {
                onChange(undefined);
                setIsOpen(false);
              }}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              Todo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
