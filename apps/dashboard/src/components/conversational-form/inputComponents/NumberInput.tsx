import { motion } from 'framer-motion';
import { useFormContext } from 'react-hook-form';

interface NumberInputProps {
  name: string;
  placeholder?: string;
  maxValue?: number;
  relatedField?: string;
  info?: string;
  onHelpClick?: () => void;
}

export function NumberInput({ name, placeholder, maxValue, relatedField, info, onHelpClick }: NumberInputProps) {
  const { register, formState: { errors }, watch } = useFormContext();

  // Watch the related field for validation
  const relatedValue = relatedField ? watch(relatedField) as number : undefined;

  return (
    <div className="space-y-2">
      <input
        {...register(name, {
          valueAsNumber: true,
          validate: (value) => {
            if (maxValue !== undefined && value > maxValue) {
              return `No puede exceder ${maxValue}`;
            }
            if (relatedField && relatedValue && value > relatedValue) {
              return `No puede exceder el valor del campo relacionado (${relatedValue})`;
            }
            return true;
          }
        })}
        type="number"
        placeholder={placeholder}
        className="w-full bg-transparent border-b-2 border-zinc-600 focus:border-lime-400 outline-none py-3 text-white placeholder-zinc-500 text-lg transition-colors"
      />
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
