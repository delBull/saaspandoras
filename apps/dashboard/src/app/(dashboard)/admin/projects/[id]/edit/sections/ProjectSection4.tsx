"use client";

import { useFormContext, useFieldArray, type UseFormReturn } from "react-hook-form";
import type { FullProjectFormData } from "../multi-step-form";
import { toast } from "sonner";
import {
  Users,
  UserPlus,
  UserMinus,
  ShieldCheck,
  PieChart
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

const Textarea = ({ id, className = "", placeholder, rows = 3, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { placeholder?: string; rows?: number }) => (
  <textarea 
    id={id}
    rows={rows}
    placeholder={placeholder}
    className={`
      w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg 
      focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent
      transition-all duration-200 placeholder-gray-500 text-white resize-vertical
      ${className}
    `}
    {...props}
  />
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

const Button = ({ children, className = "", onClick, variant = "primary", type = "button", disabled = false }: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "outline" | "danger";
  type?: "button" | "submit";
  disabled?: boolean;
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`
      px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
      ${variant === "primary" && "bg-lime-500 hover:bg-lime-600 text-white"}
      ${variant === "secondary" && "bg-zinc-700 hover:bg-zinc-600 text-white"}
      ${variant === "outline" && "border border-lime-500 text-lime-400 hover:bg-lime-500 hover:text-white"}
      ${variant === "danger" && "bg-red-500 hover:bg-red-600 text-white"}
      ${className}
    `}
  >
    {children}
  </button>
);

const TeamMemberCard = ({ index, remove, register, className = "" }: {
  index: number;
  remove: (index: number) => void;
  register: UseFormReturn<FullProjectFormData>["register"];
  className?: string;
}) => (
  <div className={`bg-zinc-800/50 p-4 rounded-lg border border-zinc-700 ${className}`}>
    <div className="flex items-start justify-between mb-3">
      <h5 className="font-semibold text-white text-sm">Miembro {index + 1}</h5>
      <Button
        variant="danger"
        onClick={() => remove(index)}
        className="text-xs px-2 py-1"
      >
        <UserMinus className="w-3 h-3 mr-1" />
        Eliminar
      </Button>
    </div>
    
    <div className="space-y-3">
      <div>
        <Label htmlFor={`teamMembers.${index}.name`}>Nombre Completo</Label>
        <Input
          id={`teamMembers.${index}.name`}
          placeholder="Juan Pérez"
          {...register(`teamMembers.${index}.name` as keyof FullProjectFormData)}
        />
      </div>
      
      <div>
        <Label htmlFor={`teamMembers.${index}.position`}>Cargo / Rol</Label>
        <Input
          id={`teamMembers.${index}.position`}
          placeholder="CEO & Fundador"
          {...register(`teamMembers.${index}.position` as keyof FullProjectFormData)}
        />
      </div>
      
      <div>
        <Label htmlFor={`teamMembers.${index}.linkedin`}>LinkedIn (opcional)</Label>
        <Input
          id={`teamMembers.${index}.linkedin`}
          type="url"
          placeholder="https://linkedin.com/in/juan-perez"
          {...register(`teamMembers.${index}.linkedin` as keyof FullProjectFormData)}
        />
      </div>
      
      <div className="pt-2 border-t border-zinc-700">
        <Label htmlFor={`teamMembers.${index}.profile`}>Breve Biografía (Opcional)</Label>
        <Textarea
          id={`teamMembers.${index}.profile`}
          placeholder="Experiencia relevante, logros, por qué es la persona adecuada para este rol..."
          {...register(`teamMembers.${index}.profile` as keyof FullProjectFormData)}
          rows={3}
        />
      </div>
    </div>
  </div>
);

const DistributionInput = ({ label, value, onChange, total, className = "" }: {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  total: number;
  className?: string;
}) => {

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    if (rawValue === "") {
      onChange(undefined);
      return;
    }
    
    let val = parseInt(rawValue) || 0;
    val = Math.max(0, Math.min(100, val));
    
    onChange(val);
  };

  return (
    <div className={className}>
      <Label>{label}</Label>
    <div className="flex gap-2">
      <Input
        type="number"
        min="0"
        max="100"
        value={value ?? ''}
        onChange={handleChange}
        className="flex-1 font-mono text-right"
        placeholder="0"
      />
      <span className="text-gray-400 self-center">%</span>
    </div>
    <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-1">
      <div
        className="bg-lime-500 h-1.5 rounded-full transition-all"
        style={{ width: `${value ?? 0}%` }}
      ></div>
    </div>
    <p className="text-xs text-gray-500 mt-1">
      Total actual: {total.toFixed(1)}% (debe sumar 100%)
    </p>
  </div>
 );
}

export function ProjectSection4() {
  const { register, control, watch, setValue } = useFormContext<FullProjectFormData>();
  const { fields: teamFields, append: appendTeam, remove: removeTeam } = useFieldArray({
    control,
    name: "teamMembers"
  });
  const { fields: advisorFields, append: appendAdvisor, remove: removeAdvisor } = useFieldArray({
    control,
    name: "advisors"
  });

  const distribution = watch("tokenDistribution") ?? {};
  const totalDistribution = Object.values(distribution).reduce((sum: number, val) => sum + (Number(val) ?? 0), 0);

  const handleDistributionChange = (key: keyof NonNullable<FullProjectFormData['tokenDistribution']>, value: number | undefined) => {
    const newDistribution = {
      ...distribution,
      [key]: value
    };
    
    setValue("tokenDistribution", newDistribution, { shouldValidate: true, shouldDirty: true });

    const newTotal = Object.values(newDistribution).reduce((sum: number, val) => sum + (Number(val) || 0), 0);
    
    if (newTotal > 100) {
      toast.warning(`La distribución total excede 100% (Actual: ${newTotal.toFixed(1)}%)`);
    }
  };


  const addTeamMember = () => {
    appendTeam({ name: "", position: "", linkedin: "" });
  };

  const addAdvisor = () => {
    appendAdvisor({ name: "", profile: "" });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Equipo, Transparencia y Distribución
        </h3>
        <p className="text-gray-400 mb-6">
          Presenta a tu equipo y explica la estructura de distribución de tokens. La transparencia genera confianza.
        </p>
      </div>

      {/* Sección 1: Equipo Principal */}
      <div className="bg-zinc-900/30 p-6 rounded-xl border border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Equipo Principal
          </h4>
          <Button 
            variant="outline" 
            onClick={addTeamMember}
            className="text-lime-400 border-lime-400 hover:bg-lime-500 hover:text-white"
          >
            <UserPlus className="w-4 h-4 mr-1" />
            Añadir Miembro
          </Button>
        </div>

        {teamFields.length === 0 ? (
          <div className="text-center py-8 bg-zinc-800/50 rounded-lg border-2 border-dashed border-zinc-700">
            <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400 mb-2">No hay miembros del equipo</p>
            <Button 
              variant="outline" 
              onClick={addTeamMember}
              className="text-lime-400 border-lime-400 hover:bg-lime-500 hover:text-white"
            >
              Añadir Primer Miembro
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {teamFields.map((field, index) => (
              <TeamMemberCard
                key={field.id}
                index={index}
                remove={removeTeam}
                register={register}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sección 2: Asesores */}
      <div className="bg-zinc-900/30 p-6 rounded-xl border border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Asesores y Mentores
          </h4>
          <Button 
            variant="outline" 
            onClick={addAdvisor}
            className="text-emerald-400 border-emerald-400 hover:bg-emerald-500 hover:text-white"
          >
            <UserPlus className="w-4 h-4 mr-1" />
            Añadir Asesor
          </Button>
        </div>

        {advisorFields.length === 0 ? (
          <div className="text-center py-8 bg-zinc-800/50 rounded-lg border-2 border-dashed border-zinc-700">
            <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400 mb-2">No hay asesores</p>
            <p className="text-xs text-gray-500">Los asesores añaden credibilidad a tu proyecto</p>
          </div>
        ) : (
          <div className="space-y-4">
            {advisorFields.map((field, index) => (
              <div key={field.id} className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
                <div className="flex items-start justify-between mb-3">
                  <h5 className="font-semibold text-white text-sm">Asesor {index + 1}</h5>
                  <Button
                    variant="danger"
                    onClick={() => removeAdvisor(index)}
                    className="text-xs px-2 py-1"
                  >
                    <UserMinus className="w-3 h-3 mr-1" />
                    Eliminar
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor={`advisors.${index}.name`}>Nombre del Asesor</Label>
                    <Input
                      id={`advisors.${index}.name`}
                      placeholder="María García"
                      {...register(`advisors.${index}.name` as const)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`advisors.${index}.profile`}>Perfil / Especialidad</Label>
                    <Input
                      id={`advisors.${index}.profile`}
                      placeholder="Experta en blockchain y tokenización de activos"
                      {...register(`advisors.${index}.profile` as const)}
                    />
                  </div>
                  
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sección 3: Distribución de Tokens */}
      <div className="bg-zinc-900/30 p-6 rounded-xl border border-zinc-800">
        <h4 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5" />
          Distribución de Tokens
        </h4>
        
        {totalDistribution > 100 && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-300 text-sm">
              ⚠️ La distribución total excede el 100%. Ajusta los porcentajes.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DistributionInput
            label="Venta Pública"
            value={distribution?.publicSale} 
            onChange={(value) => handleDistributionChange("publicSale", value)}
            total={totalDistribution}
            className="md:col-span-2"
          />
          
          <DistributionInput
            label="Equipo y Fundadores"
            value={distribution?.team}
            onChange={(value) => handleDistributionChange("team", value)}
            total={totalDistribution}
          />
          
          <DistributionInput
            label="Tesorería"
            value={distribution?.treasury}
            onChange={(value) => handleDistributionChange("treasury", value)}
            total={totalDistribution}
          />
          
          <DistributionInput
            label="Marketing y Partnerships"
            value={distribution?.marketing}
            onChange={(value) => handleDistributionChange("marketing", value)}
            total={totalDistribution}
          />
        </div>


        <div className="mt-6 pt-4 border-t border-zinc-700">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-400">Total Distribución:</span>
            <span className={`font-bold text-lg ${totalDistribution === 100 ? 'text-lime-400' : 'text-red-400'}`}>
              {totalDistribution.toFixed(1)}%
            </span>
          </div>
          
          {totalDistribution !== 100 && totalDistribution > 0 && (
            <div className="text-center p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-300 text-sm">
                {totalDistribution < 100 ? 'Te faltan' : 'Excedes'} {Math.abs(100 - totalDistribution).toFixed(1)}% para completar la distribución
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sección 4: Direcciones de Contratos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="contractAddress">Dirección del Contrato (futuro)</Label>
          <Input
            id="contractAddress"
            placeholder="0x1234...abcd (desplegar después de aprobación)"
            {...register("contractAddress")}
          />
          <p className="text-xs text-gray-500 mt-1">
            Dirección del smart contract del token (puedes añadir después del despliegue)
          </p>
        </div>

        <div>
          <Label htmlFor="treasuryAddress">Dirección de Tesorería</Label>
          <Input
            id="treasuryAddress"
            placeholder="0x5678...efgh (multisig recomendado)"
            {...register("treasuryAddress")}
          />
          <p className="text-xs text-gray-500 mt-1">
            Wallet multisig donde se recibirán los fondos. Muy recomendado para transparencia.
          </p>
        </div>
      </div>

      {/* Consejo de Transparencia */}
      <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-lg p-4">
        <h5 className="text-sm font-medium text-blue-300 mb-2 flex items-center gap-1">
          <ShieldCheck className="w-4 h-4" />
          Consejo de Transparencia
        </h5>
        <p className="text-xs text-blue-200">
          <strong>El equipo es tu mayor activo:</strong> Los inversionistas invierten en personas, no solo en ideas. 
          Presenta perfiles sólidos con experiencia relevante. La distribución de tokens debe ser justa y transparente - 
          evita concentraciones excesivas en pocas manos. Usa wallets multisig para la tesorería.
        </p>
      </div>
    </div>
  );
 }