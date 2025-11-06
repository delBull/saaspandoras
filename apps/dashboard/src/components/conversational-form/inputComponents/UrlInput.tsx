import { motion } from 'framer-motion';
import { useFormContext } from 'react-hook-form';

interface UrlInputProps {
  name: string;
  placeholder?: string;
  info?: string;
}

export function UrlInput({ name, placeholder, info }: UrlInputProps) {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-2">
      <input
        {...register(name)}
        type="url"
        placeholder={placeholder}
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
