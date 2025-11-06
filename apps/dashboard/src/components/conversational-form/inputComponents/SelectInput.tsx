import { motion } from 'framer-motion';
import { useFormContext } from 'react-hook-form';

interface SelectInputProps {
  name: string;
  options?: { value: string; label: string }[];
  info?: string;
  onHelpClick?: () => void;
}

export function SelectInput({ name, options, info, onHelpClick }: SelectInputProps) {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-2">
      <select
        {...register(name)}
        className="w-full bg-zinc-800/0 border-b-2 border-zinc-600 focus:border-lime-400 outline-none py-3 text-white text-lg transition-colors"
      >
        <option value="">Selecciona una opción...</option>
        {options?.map((option) => (
          <option key={option.value} value={option.value} className="bg-zinc-800/0">
            {option.label}
          </option>
        ))}
      </select>
      {info && (
        <div className="flex items-start gap-2 mt-2">
          <p className="text-sm text-zinc-400 leading-relaxed flex-1">
            💡 {info}
          </p>
          {onHelpClick && (
            <button
              type="button"
              onClick={onHelpClick}
              className="text-lime-400 hover:text-lime-300 text-sm font-medium underline underline-offset-2 flex-shrink-0"
            >
              Más info
            </button>
          )}
        </div>
      )}
      {errors[name] && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-400 text-sm"
        >
          {errors[name]?.message as string}
        </motion.p>
      )}
    </div>
  );
}
