"use client";

import { useFormContext } from "react-hook-form";
import type { FullProjectFormData } from "../multi-step-form";
import { toast } from "sonner";
import { 
  Lock,
  Key,
  Shield,
  AlertTriangle,
  CheckCircle,
  Database,
  Code2
} from "lucide-react";

// Componentes UI reutilizados
const Input = ({ id, type = "text", className = "", placeholder, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { placeholder?: string }) => (
  <input 
    id={id}
    type={type}
    placeholder={placeholder}
    className={`
      w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg 
      focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent
      transition-all duration-200 placeholder-gray-500 text-white
      ${className}
    `} 
    {...props}
  />
);

const Checkbox = ({ id, checked, onChange, className = "", children }: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  children: React.ReactNode;
}) => (
  <label className={`flex items-center gap-3 cursor-pointer ${className}`}>
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="rounded border-zinc-700 text-lime-500 focus:ring-lime-500 bg-zinc-800/50"
    />
    <span className="text-sm text-white select-none">{children}</span>
  </label>
);

const Label = ({ htmlFor, children, required = false, className = "" }: { 
  htmlFor?: string; 
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) => (
  <label 
    htmlFor={htmlFor} 
    className={`text-sm font-semibold text-white mb-2 flex items-center gap-1 ${className}`}
  >
    {children}
    {required && <span className="text-red-400 text-xs">*</span>}
  </label>
);

const ErrorMessage = ({ children }: { children: React.ReactNode }) => (
  <p className="text-red-400 text-xs mt-1">{children}</p>
);

const SecurityFeature = ({ 
  icon: Icon, 
  title, 
  description, 
  children, 
  status = "neutral",
  className = ""
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
  status?: "secure" | "warning" | "danger" | "neutral";
  className?: string;
}) => {
  const getStatusStyles = () => {
    switch (status) {
      case "secure": return "border-green-500/30 bg-green-500/5 text-green-300";
      case "warning": return "border-yellow-500/30 bg-yellow-500/5 text-yellow-300";
      case "danger": return "border-red-500/30 bg-red-500/5 text-red-300";
      default: return "border-zinc-700/50 bg-zinc-800/50 text-gray-300";
    }
  };

  return (
    <div className={`${getStatusStyles()} border rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3 mb-3">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${status === "secure" ? "text-green-400" : status === "warning" ? "text-yellow-400" : status === "danger" ? "text-red-400" : "text-gray-400"}`} />
        <div className="flex-1 min-w-0">
          <h5 className="font-semibold text-sm mb-1">{title}</h5>
          <p className="text-xs opacity-75 line-clamp-2">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
};

export function ProjectSection6() {
  const { watch, formState: { errors }, setValue } = useFormContext<FullProjectFormData>();
  
  const isMintable = watch("isMintable") ?? false;
  const isMutable = watch("isMutable") ?? false;
  const updateAuthorityAddress = watch("updateAuthorityAddress") ?? "";

  const handleToggle = (field: "isMintable" | "isMutable") => (checked: boolean) => {
    setValue(field, checked);
    
    // Show warnings for risky configurations
    if (checked && field === "isMutable") {
      toast.warning("⚠️ Tokens mutables pueden generar desconfianza. Considera usar upgradeable proxies en su lugar.");
    }
    if (checked && field === "isMintable" && isMintable) {
      toast.info("✅ Minting habilitado - asegúrate de tener controles de acceso adecuados.");
    }
  };

  const isValidAddress = (address: string) => {
    return address.length === 42 && address.startsWith("0x");
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue("updateAuthorityAddress", value);
    
    if (value && !isValidAddress(value)) {
      toast.error("Dirección inválida de Ethereum. Debe ser 0x... (42 caracteres)");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <Code2 className="w-5 h-5" />
          Parámetros Técnicos y Seguridad del Contrato
        </h3>
        <p className="text-gray-400 mb-6">
          Configura los parámetros técnicos de tu token y establece las medidas de seguridad. La seguridad es primordial.
        </p>
      </div>

      {/* Sección 1: Parámetros de Minting */}
      <div className="bg-zinc-900/30 p-6 rounded-xl border border-zinc-800">
        <h4 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Parámetros de Creación (Minting)
        </h4>
        
        <SecurityFeature
          icon={Lock}
          title="Mintable (Creación de Nuevos Tokens)"
          description="Determina si se pueden crear nuevos tokens después del lanzamiento inicial"
          status={isMintable ? "warning" : "secure"}
        >
          <div className="mt-3">
            <Checkbox
              id="isMintable"
              checked={isMintable}
              onChange={handleToggle("isMintable")}
            >
              Habilitar minting post-lanzamiento
            </Checkbox>
            
            {isMintable && (
              <div className="ml-6 mt-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-xs text-yellow-300">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  <strong>Advertencia:</strong> El minting habilitado puede generar desconfianza. Considera:
                </p>
                <ul className="text-xs text-yellow-200 mt-1 space-y-1 ml-4">
                  <li>• Usar multisig para autorizar minting</li>
                  <li>• Establecer límites máximos de supply</li>
                  <li>• Implementar timelocks para operaciones</li>
                  <li>• Documentar claramente la política de minting</li>
                </ul>
              </div>
            )}
          </div>
        </SecurityFeature>
      </div>

      {/* Sección 2: Parámetros de Mutabilidad */}
      <div className="bg-zinc-900/30 p-6 rounded-xl border border-zinc-800">
        <h4 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
          <Key className="w-5 h-5" />
          Parámetros de Actualización (Mutabilidad)
        </h4>
        
        <SecurityFeature
          icon={Key}
          title="Información Mutable"
          description="Determina si los metadatos del token pueden ser modificados después del despliegue"
          status={isMutable ? "danger" : "secure"}
        >
          <div className="mt-3">
            <Checkbox
              id="isMutable"
              checked={isMutable}
              onChange={handleToggle("isMutable")}
            >
              Permitir actualizaciones de metadatos
            </Checkbox>
            
            {isMutable && (
              <div className="ml-6 mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-xs text-red-300">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  <strong>Alto Riesgo:</strong> Tokens con metadatos mutables son considerados de alto riesgo:
                </p>
                <ul className="text-xs text-red-200 mt-1 space-y-1 ml-4">
                  <li>• • Posibilidad de &quot;rug pulls&quot; mediante cambios de metadatos</li>
                  <li>• • Dificultad para listar en DEX y marketplaces</li>
                  <li>• • Desconfianza general en la comunidad</li>
                  <li>• • Recomendación: Usa URIs inmutables o upgradeable proxies</li>
                </ul>
              </div>
            )}
          </div>
        </SecurityFeature>
      </div>

      {/* Sección 3: Autoridad de Actualización */}
      <div className="space-y-4">
        <SecurityFeature
          icon={Shield}
          title="Autoridad de Actualización"
          description="Dirección que tiene permisos para realizar actualizaciones al contrato"
          status={updateAuthorityAddress ? (isValidAddress(updateAuthorityAddress) ? "secure" : "warning") : "neutral"}
        >
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="updateAuthorityAddress" required>Dirección de Autoridad (Admin)</Label>
              <Input
                id="updateAuthorityAddress"
                type="text"
                placeholder="0x742d35Cc6f4D6e5d8A0b6A5b5c5f5e5f5e5f5e5f"
                value={updateAuthorityAddress}
                onChange={handleAddressChange}
                maxLength={42}
                className={isValidAddress(updateAuthorityAddress) ? "" : "border-red-500/50 focus:ring-red-500"}
              />
              {errors.updateAuthorityAddress && <ErrorMessage>{errors.updateAuthorityAddress.message}</ErrorMessage>}
              {!updateAuthorityAddress && (
                <p className="text-xs text-gray-500 mt-1">
                  Dirección que controlará las funciones admin del contrato (recomendado: multisig wallet)
                </p>
              )}
              {updateAuthorityAddress && !isValidAddress(updateAuthorityAddress) && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Dirección inválida - debe ser una dirección Ethereum válida (0x... 42 caracteres)
                </p>
              )}
              {isValidAddress(updateAuthorityAddress) && (
                <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Dirección válida - {updateAuthorityAddress.slice(0, 6)}...{updateAuthorityAddress.slice(-4)}
                </p>
              )}
            </div>
            
            <div className="md:col-span-1">
              <div className={`p-4 rounded-lg border ${isValidAddress(updateAuthorityAddress) ? "border-green-500/30 bg-green-500/5" : "border-zinc-700/50 bg-zinc-800/50"}`}>
                <h5 className="font-medium text-sm mb-2 flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  {isValidAddress(updateAuthorityAddress) ? "Configuración Segura" : "Configuración Pendiente"}
                </h5>
                <ul className="text-xs space-y-1">
                  <li className={`flex items-center gap-2 ${isValidAddress(updateAuthorityAddress) ? "text-green-300" : "text-gray-400"}`}>
                    <CheckCircle className={`w-3 h-3 ${isValidAddress(updateAuthorityAddress) ? "" : "opacity-50"}`} />
                    Dirección admin definida
                  </li>
                  <li className="flex items-center gap-2 text-gray-400">
                    <Shield className="w-3 h-3" />
                    Recomendado: Wallet multisig (Gnosis Safe)
                  </li>
                  <li className="flex items-center gap-2 text-gray-400">
                    <Key className="w-3 h-3" />
                    Múltiples firmantes para operaciones críticas
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </SecurityFeature>
      </div>

      {/* Sección 4: Parámetros de Seguridad Adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SecurityFeature
          icon={Shield}
          title="Pausable"
          description="El contrato puede ser pausado en emergencias"
          status="secure"
          className="md:col-span-2"
        >
          <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-sm text-green-200">
              <CheckCircle className="w-4 h-4 inline mr-2" />
              <strong>Seguridad Incluida:</strong> Todos los contratos Pandoras incluyen funcionalidad pausable 
              con multisig admin. Esto permite detener transacciones en caso de exploits o emergencias sin 
              afectar la propiedad de los tokens.
            </p>
          </div>
        </SecurityFeature>

        <SecurityFeature
          icon={Lock}
          title="Timelocks"
          description="Las operaciones admin requieren período de espera"
          status="secure"
        >
          <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-sm text-green-200">
              <CheckCircle className="w-4 h-4 inline mr-2" />
              <strong>Protección Incluida:</strong> 48 horas de timelock para todas las operaciones admin. 
              Los inversionistas tienen tiempo para reaccionar ante cualquier cambio propuesto.
            </p>
          </div>
        </SecurityFeature>

        <SecurityFeature
          icon={Shield}
          title="Auditorías"
          description="Contrato auditado por firmas de seguridad reconocidas"
          status="warning"
        >
          <div className="mt-3">
            <p className="text-sm text-yellow-200 mb-2">
              <AlertTriangle className="w-4 h-4 inline mr-2 text-yellow-400" />
              <strong>Próximo Paso:</strong> Después de la aprobación, tu contrato será auditado por firmas 
              líderes en seguridad blockchain (OpenZeppelin, Trail of Bits, ConsenSys Diligence).
            </p>
            <p className="text-xs text-yellow-300">
              Costo aproximado: $15,000 - $50,000 USD dependiendo de la complejidad
            </p>
          </div>
        </SecurityFeature>
      </div>

      {/* Consejo de Seguridad */}
      <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-lg p-4">
        <h5 className="text-sm font-medium text-indigo-300 mb-2 flex items-center gap-1">
          <Shield className="w-4 h-4" />
          Mejores Prácticas de Seguridad
        </h5>
        <div className="text-xs text-indigo-200 space-y-2">
          <p><strong>Configuración Recomendada:</strong></p>
          <ul className="space-y-1 ml-4 list-disc text-indigo-200">
            <li>❌ <strong>NO</strong> habilitar minting post-lanzamiento</li>
            <li>❌ <strong>NO</strong> permitir metadatos mutables</li>
            <li>✅ Usar wallet multisig para admin (Gnosis Safe con 3/5 firmantes)</li>
            <li>✅ Implementar timelocks de 48+ horas</li>
            <li>✅ Auditoría profesional obligatoria</li>
            <li>✅ Publicar código fuente verificado en Etherscan</li>
            <li>✅ Renunciar a ownership después del lanzamiento (si aplica)</li>
          </ul>
          <p className="mt-3 font-medium text-indigo-300">
            Los inversionistas priorizan la seguridad. Una configuración conservadora genera mayor confianza y mejores términos.
          </p>
        </div>
      </div>
    </div>
  );
}