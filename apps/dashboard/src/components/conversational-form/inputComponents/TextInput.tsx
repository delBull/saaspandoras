import { motion } from 'framer-motion';
import { useFormContext } from 'react-hook-form';

interface TextInputProps {
  name: string;
  placeholder?: string;
  maxLength?: number;
  info?: string;
  onHelpClick?: () => void;
}

export function TextInput({ name, placeholder, maxLength, info, onHelpClick: _onHelpClick }: TextInputProps) {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-2">
      <input
        {...register(name)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full bg-transparent border-b-2 border-zinc-600 focus:border-lime-400 outline-none py-3 text-white placeholder-zinc-500 text-lg transition-colors"
      />
      {info && (
        <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
          💡 {info}
        </p>
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
