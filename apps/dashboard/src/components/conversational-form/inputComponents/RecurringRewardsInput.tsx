import { motion } from 'framer-motion';
import { useFormContext } from 'react-hook-form';
import { useEffect } from 'react';

export function RecurringRewardsInput() {
  const { register, formState: { errors }, watch, setValue } = useFormContext();

  // Watch all the checkbox values
  const stakingEnabled = watch('stakingRewardsEnabled') as boolean;
  const revenueSharingEnabled = watch('revenueSharingEnabled') as boolean;
  const workToEarnEnabled = watch('workToEarnEnabled') as boolean;
  const tieredAccessEnabled = watch('tieredAccessEnabled') as boolean;
  const discountedFeesEnabled = watch('discountedFeesEnabled') as boolean;

  // Watch all the details fields
  const stakingDetails = watch('stakingRewardsDetails') as string;
  const revenueSharingDetails = watch('revenueSharingDetails') as string;
  const workToEarnDetails = watch('workToEarnDetails') as string;
  const tieredAccessDetails = watch('tieredAccessDetails') as string;
  const discountedFeesDetails = watch('discountedFeesDetails') as string;

  // Consolidate all data into recurringRewards field as JSON
  useEffect(() => {
    const rewardsData = {
      stakingRewardsEnabled: stakingEnabled || false,
      stakingRewardsDetails: stakingDetails || '',
      revenueSharingEnabled: revenueSharingEnabled || false,
      revenueSharingDetails: revenueSharingDetails || '',
      workToEarnEnabled: workToEarnEnabled || false,
      workToEarnDetails: workToEarnDetails || '',
      tieredAccessEnabled: tieredAccessEnabled || false,
      tieredAccessDetails: tieredAccessDetails || '',
      discountedFeesEnabled: discountedFeesEnabled || false,
      discountedFeesDetails: discountedFeesDetails || '',
    };

    // Only set value if there's actual data
    const hasData = Object.values(rewardsData).some(value =>
      typeof value === 'boolean' ? value : typeof value === 'string' && value.trim().length > 0
    );

    if (hasData) {
      setValue('recurringRewards', JSON.stringify(rewardsData));
    } else {
      setValue('recurringRewards', '');
    }
  }, [
    stakingEnabled, stakingDetails,
    revenueSharingEnabled, revenueSharingDetails,
    workToEarnEnabled, workToEarnDetails,
    tieredAccessEnabled, tieredAccessDetails,
    discountedFeesEnabled, discountedFeesDetails,
    setValue
  ]);

  const rewardOptions = [
    {
      id: 'stakingRewardsEnabled',
      label: 'Recompensas por Staking',
      description: 'Recompensas por Bloqueo (Staking) del Artefacto.',
      placeholder: 'Estima la frecuencia y el rango de % de Artefactos adicionales.',
      enabled: stakingEnabled,
      detailsField: 'stakingRewardsDetails'
    },
    {
      id: 'revenueSharingEnabled',
      label: 'Participación en Ingresos',
      description: 'Distribución de una porción de los ingresos del Protocolo (Revenue Share).',
      placeholder: 'Estima el % de ingresos que se distribuirá y la frecuencia.',
      enabled: revenueSharingEnabled,
      detailsField: 'revenueSharingDetails'
    },
    {
      id: 'workToEarnEnabled',
      label: 'Incentivos por Labor',
      description: 'Pagos o incentivos por la "Labor" o contribución activa a la comunidad (Work-to-Earn).',
      placeholder: 'Describe la magnitud promedio de la recompensa por Labor (ej. X tokens/semana).',
      enabled: workToEarnEnabled,
      detailsField: 'workToEarnDetails'
    },
    {
      id: 'tieredAccessEnabled',
      label: 'Acceso Escalable',
      description: 'Desbloqueo de nueva utilidad/acceso a medida que se mantiene la posesión del Artefacto (Tiers).',
      placeholder: 'Describe los hitos de tiempo o de uso que desbloquean nuevos beneficios.',
      enabled: tieredAccessEnabled,
      detailsField: 'tieredAccessDetails'
    },
    {
      id: 'discountedFeesEnabled',
      label: 'Descuentos/Tarifas Reducidas',
      description: 'Reducción de tarifas por uso de servicios futuros del Creador.',
      placeholder: 'Detalla el % promedio de descuento que se ofrece.',
      enabled: discountedFeesEnabled,
      detailsField: 'discountedFeesDetails'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="text-xs text-zinc-400 mb-3">
        💡 ¿Cómo y con qué frecuencia se traducirá la utilidad en valor recurrente para el poseedor del Artefacto?. Selecciona los tipos de recompensa recurrente que aplicarán y estima su frecuencia o magnitud.
      </div>

      {rewardOptions.map((option) => (
        <div key={option.id} className="space-y-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              {...register(option.id)}
              type="checkbox"
              checked={option.enabled || false}
              onChange={(e) => setValue(option.id, e.target.checked)}
              className="mt-0.5 w-4 h-4 text-lime-400 bg-zinc-800 border-zinc-600 rounded focus:ring-lime-400 focus:ring-2"
            />
            <div className="flex-1">
              <div className="text-white font-medium text-sm">
                {option.label}
              </div>
              <div className="text-zinc-400 text-xs mt-0.5">
                {option.description}
              </div>
            </div>
          </label>

          {option.enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="ml-7"
            >
              <textarea
                {...register(option.detailsField)}
                placeholder={option.placeholder}
                rows={2}
                className="w-full bg-transparent border-b-2 border-zinc-600 focus:border-lime-400 outline-none py-1 text-white placeholder-zinc-500 text-sm transition-colors resize-none"
              />
              {errors[option.detailsField] && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs mt-1"
                >
                  {errors[option.detailsField]?.message as string}
                </motion.p>
              )}
            </motion.div>
          )}
        </div>
      ))}
    </div>
  );
}
