import { InfoModal } from '@/components/InfoModal';

interface KycModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KycModal({ isOpen, onClose }: KycModalProps) {
  return (
    <InfoModal
      isOpen={isOpen}
      onClose={onClose}
      title="¿Qué es KYC Básico?"
      description="Información sobre la verificación de identidad"
      icon="🛡️"
      content={
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-white mb-2">¿Qué es KYC Básico?</h4>
            <p className="text-gray-300 text-sm leading-relaxed">
              KYC Básico es un proceso de verificación de identidad simplificado que nos ayuda a confirmar
              que eres una persona real y no un bot o cuenta fraudulenta.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-2">¿Por qué lo pedimos?</h4>
            <ul className="text-gray-300 text-sm space-y-1 ml-4">
              <li>• <strong>Seguridad:</strong> Proteger la plataforma contra fraudes y abusos</li>
              <li>• <strong>Confiabilidad:</strong> Asegurar que las comunidades sean reales y valiosas</li>
              <li>• <strong>Cumplimiento:</strong> Mantener estándares regulatorios básicos</li>
              <li>• <strong>Recompensas:</strong> Permitir la distribución justa de tokens y beneficios</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-2">¿Qué información pedimos?</h4>
            <ul className="text-gray-300 text-sm space-y-1 ml-4">
              <li>• Nombre completo y fecha de nacimiento</li>
              <li>• Dirección de email y teléfono</li>
              <li>• Dirección residencial básica</li>
              <li>• Identificación fiscal (RFC u equivalente)</li>
            </ul>
          </div>

          <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">ℹ️</span>
              <div>
                <p className="text-blue-200 text-sm font-medium">¿Es obligatorio?</p>
                <p className="text-blue-100 text-xs mt-1">
                  No, KYC Básico es completamente opcional. Puedes usar la plataforma sin verificarte,
                  pero algunas funciones avanzadas pueden requerir verificación.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <span className="text-green-400 mt-0.5">🔒</span>
              <div>
                <p className="text-green-200 text-sm font-medium">Privacidad y Seguridad</p>
                <p className="text-green-100 text-xs mt-1">
                  Toda la información se almacena de forma segura y encriptada.
                  Nunca compartimos tus datos personales con terceros.
                </p>
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
}
