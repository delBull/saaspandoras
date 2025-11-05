import { motion } from 'framer-motion';
import { useFormContext } from 'react-hook-form';

interface CheckboxInputProps {
  name: string;
  info?: string;
  label?: string;
}

export function CheckboxInput({ name, info, label }: CheckboxInputProps) {
  const { register, formState: { errors }, watch, setValue } = useFormContext();

  // Watch the current value
  const currentValue = watch(name) as boolean;

  // Default label for verification agreement
  const checkboxLabel = label ?? "Declaro que toda la información proporcionada es precisa. Entiendo y acepto que Pandora's Finance actúa exclusivamente como un proveedor de infraestructura SaaS 'no-code', y que soy el único responsable de la estructura legal, la promesa de utilidad y la gestión de la comunidad de mi 'Creación' y sus Artefactos.";

  // Show confirmation only for verification agreement
  const showConfirmation = name === 'verificationAgreement';

  // Use larger text size for isMintable field (step 16)
  const textSizeClass = name === 'isMintable' ? 'text-2xl md:text-3xl font-bold leading-tight' : 'text-lg leading-relaxed';

  // Handle checkbox change for boolean values
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(name, e.target.checked);
  };

  return (
    <div className="space-y-2">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          {...register(name)}
          type="checkbox"
          checked={currentValue || false}
          onChange={handleChange}
          className="mt-1 w-5 h-5 text-lime-400 bg-zinc-800 border-zinc-600 rounded focus:ring-lime-400 focus:ring-2"
        />
        <span className={`text-white ${textSizeClass}`}>
          {checkboxLabel}
        </span>
      </label>
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

      {showConfirmation && currentValue && (
        <div className="mt-3 p-3 bg-lime-500/10 border border-lime-500/20 rounded-lg">
          <p className="text-sm text-lime-300 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Declaración aceptada
          </p>
        </div>
      )}
    </div>
  );
}
