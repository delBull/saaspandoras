"use client";

import { useFormContext } from "react-hook-form";
import { useEffect } from "react";
import type { FullProjectFormData } from "../multi-step-form";
import {
  DollarSign,
  Percent,
  TrendingUp,
  Calculator,
  PieChart,
  Building
} from "lucide-react";

// Componentes UI reutilizados (patrón consistente)
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

const NumberInput = ({ id, className = "", placeholder, onChange, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { placeholder?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
  <Input
    id={id}
    type="number"
    step="0.01"
    min="0"
    placeholder={placeholder}
    onChange={onChange}
    className={`
      font-mono text-right
      ${className}
    `}
    {...props}
  />
);

const Textarea = ({ id, className = "", placeholder, rows = 4, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { placeholder?: string; rows?: number }) => (
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

const Select = ({ id, className = "", children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) => (
  <select 
    id={id}
    className={`
      w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg 
      focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent
      transition-all duration-200 text-white
      ${className}
    `}
    {...props}
  >
    {children}
  </select>
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

const Tooltip = ({ children, content }: { children: React.ReactNode; content: string }) => (
  <div className="relative group">
    {children}
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
      {content}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-800"></div>
    </div>
  </div>
);

const MetricDisplay = ({ label, value, icon: Icon, color = "lime" }: { 
  label: string; 
  value: string | number; 
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
}) => (
  <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700 text-center">
    <div className={`inline-flex items-center gap-2 mb-1`}>
      <Icon className={`w-4 h-4 text-${color}-400`} />
      <span className="text-xs font-medium text-gray-400">{label}</span>
    </div>
    <div className="text-lg font-bold text-white">{value}</div>
  </div>
);

export function ProjectSection3() {
  const { register, watch, formState: { errors }, setValue } = useFormContext<FullProjectFormData>();
  
  // Watch fields for calculations
  const targetAmount = watch("targetAmount") ?? 0;
  const totalValuationUsd = watch("totalValuationUsd") ?? 0;
  const totalTokens = watch("totalTokens") ?? 0;
  const tokensOffered = watch("tokensOffered") ?? 0;
  const tokenPriceUsd = watch("tokenPriceUsd") ?? 0;
  const estimatedApy = watch("estimatedApy") ?? "0";
  
  // Auto-calculate total funding amount
  const calculatedTotal = Number(tokensOffered) * Number(tokenPriceUsd);
  useEffect(() => {
    if (tokensOffered > 0 && tokenPriceUsd > 0 && calculatedTotal !== targetAmount) {
      setValue("targetAmount", calculatedTotal);
    }
  }, [tokensOffered, tokenPriceUsd, calculatedTotal, setValue, targetAmount]);

  // Format numbers
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const handleNumberInput = (field: keyof FullProjectFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (/^\d*\.?\d*$/.test(value) || value === '') {
      setValue(field, value === '' ? 0 : Number(value));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Tokenomics y Estructura de la Oferta
        </h3>
        <p className="text-gray-400 mb-6">
          Define los detalles financieros y de token de tu proyecto. Esta información es crucial para los inversionistas.
        </p>
      </div>

      {/* Métricas Principales - Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricDisplay 
          label="Monto a Fondear" 
          value={formatCurrency(targetAmount)} 
          icon={DollarSign} 
          color="lime"
        />
        <MetricDisplay 
          label="Valuación Total" 
          value={formatCurrency(totalValuationUsd)} 
          icon={TrendingUp} 
          color="emerald"
        />
        <MetricDisplay 
          label="APY Estimado" 
          value={formatPercent(Number(estimatedApy) || 0)} 
          icon={Percent} 
          color="yellow"
        />
      </div>

      {/* Sección 1: Objetivos Financieros */}
      <div className="bg-zinc-900/30 p-6 rounded-xl border border-zinc-800">
        <h4 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
          <Building className="w-5 h-5" />
          Objetivos Financieros
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Monto a Fondear */}
          <div>
            <Label htmlFor="targetAmount" required>
              Monto Total a Fondear (USD)
              <Tooltip content="Cantidad total que necesitas recaudar para tu proyecto">
                <span className="ml-1 text-gray-400 hover:text-lime-400 cursor-help">ℹ️</span>
              </Tooltip>
            </Label>
            <NumberInput
              id="targetAmount"
              placeholder="100000"
              value={targetAmount}
              onChange={handleNumberInput("targetAmount")}
            />
            {errors.targetAmount && <ErrorMessage>{errors.targetAmount.message}</ErrorMessage>}
            <p className="text-xs text-gray-500 mt-1">
              Monto total que tu proyecto necesita recaudar. Se calculará automáticamente desde los tokens ofrecidos.
            </p>
          </div>

          {/* Valuación Total */}
          <div>
            <Label htmlFor="totalValuationUsd" required>
              Valuación Total Pre-Money (USD)
            </Label>
            <NumberInput
              id="totalValuationUsd"
              placeholder="5000000"
              value={totalValuationUsd}
              onChange={handleNumberInput("totalValuationUsd")}
            />
            {errors.totalValuationUsd && <ErrorMessage>{errors.totalValuationUsd.message}</ErrorMessage>}
            <p className="text-xs text-gray-500 mt-1">
              Valuación total de tu empresa/proyecto antes de esta ronda de financiación
            </p>
          </div>
        </div>
      </div>

      {/* Sección 2: Tipo de Token */}
      <div>
        <h4 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5" />
          Tipo de Token y Supply
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Tipo de Token */}
          <div>
            <Label htmlFor="tokenType" required>Tipo de Token</Label>
            <Select id="tokenType" {...register("tokenType")}>
              <option value="erc20">ERC-20 (Fungible)</option>
              <option value="erc721">ERC-721 (NFT)</option>
              <option value="erc1155">ERC-1155 (Híbrido)</option>
            </Select>
            {errors.tokenType && <ErrorMessage>{errors.tokenType.message}</ErrorMessage>}
            <p className="text-xs text-gray-500 mt-1">Selecciona el estándar de token que usarás</p>
          </div>

          {/* Total Supply */}
          <div>
            <Label htmlFor="totalTokens">Supply Total</Label>
            <NumberInput
              id="totalTokens"
              placeholder="1000000000"
              value={totalTokens}
              onChange={handleNumberInput("totalTokens")}
            />
            {errors.totalTokens && <ErrorMessage>{errors.totalTokens.message}</ErrorMessage>}
            <p className="text-xs text-gray-500 mt-1">Total de tokens que existirán (incluyendo no ofrecidos)</p>
          </div>

          {/* Tokens Ofrecidos */}
          <div>
            <Label htmlFor="tokensOffered" required>Tokens Ofrecidos</Label>
            <NumberInput
              id="tokensOffered"
              placeholder="250000000"
              value={tokensOffered}
              onChange={handleNumberInput("tokensOffered")}
            />
            {errors.tokensOffered && <ErrorMessage>{errors.tokensOffered.message}</ErrorMessage>}
            <p className="text-xs text-gray-500 mt-1">Tokens disponibles en esta ronda de financiación</p>
          </div>

          {/* Precio por Token */}
          <div>
            <Label htmlFor="tokenPriceUsd" required>Precio por Token (USD)</Label>
            <NumberInput
              id="tokenPriceUsd"
              placeholder="0.01"
              step="0.000001"
              value={tokenPriceUsd}
              onChange={handleNumberInput("tokenPriceUsd")}
            />
            {errors.tokenPriceUsd && <ErrorMessage>{errors.tokenPriceUsd.message}</ErrorMessage>}
            <p className="text-xs text-gray-500 mt-1">Precio de venta por token en esta ronda</p>
          </div>
        </div>

        {/* Calculadora Automática */}
        {tokensOffered > 0 && tokenPriceUsd > 0 && (
          <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-5 h-5 text-emerald-400" />
              <h5 className="font-semibold text-emerald-300">Calculadora Automática</h5>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-zinc-800/50 p-3 rounded-lg">
                <p className="text-gray-400">Tokens ofrecidos × Precio por token</p>
                <p className="text-white font-mono text-lg mt-1">
                  {tokensOffered.toLocaleString()} × ${tokenPriceUsd.toFixed(6)}
                </p>
              </div>
              <div className="bg-zinc-800/50 p-3 rounded-lg">
                <p className="text-gray-400">Monto total calculado</p>
                <p className="text-lime-400 font-bold text-lg mt-1">
                  {formatCurrency(calculatedTotal)}
                </p>
              </div>
            </div>
            <p className="text-xs text-emerald-200 mt-3">
              El monto a fondear se actualizará automáticamente. Revisa que coincida con tu objetivo.
            </p>
          </div>
        )}
      </div>

      {/* Sección 3: Rendimiento y Lock-up */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* APY Estimado */}
        <div>
          <Label htmlFor="estimatedApy" required>APY Estimado (%)</Label>
          <NumberInput
            id="estimatedApy"
            placeholder="12.5"
            step="0.1"
            value={Number(estimatedApy)}
            onChange={handleNumberInput("estimatedApy")}
          />
          {errors.estimatedApy && <ErrorMessage>{errors.estimatedApy.message}</ErrorMessage>}
          <p className="text-xs text-gray-500 mt-1">
            Rendimiento anual estimado para los inversionistas. Sé realista y transparente.
          </p>
        </div>

        {/* Fuente del Rendimiento */}
        <div>
          <Label htmlFor="yieldSource" required>Fuente del Rendimiento</Label>
          <Select id="yieldSource" {...register("yieldSource")}>
            <option value="rental_income">Rentas de Alquiler</option>
            <option value="capital_appreciation">Plusvalía por Venta</option>
            <option value="dividends">Dividendos de la Empresa</option>
            <option value="royalties">Regalías / Licencias</option>
            <option value="other">Otro (especificar abajo)</option>
          </Select>
          {errors.yieldSource && <ErrorMessage>{errors.yieldSource.message}</ErrorMessage>}
        </div>
      </div>

      {/* Lock-up y Destino de Fondos */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="lockupPeriod">Periodo de Lock-up</Label>
          <Input
            id="lockupPeriod"
            placeholder="Ej: 12 meses para equipo, 6 meses para inversionistas"
            {...register("lockupPeriod")}
          />
          {errors.lockupPeriod && <ErrorMessage>{errors.lockupPeriod.message}</ErrorMessage>}
          <p className="text-xs text-gray-500 mt-1">
            Periodos de bloqueo para diferentes tipos de tokens/inversionistas
          </p>
        </div>

        <div>
          <Label htmlFor="fundUsage" required>Destino de los Fondos</Label>
          <Textarea
            id="fundUsage"
            placeholder="Describe detalladamente cómo usarás los fondos recaudados. Sé específico sobre porcentajes y destinos..."
            rows={4}
            {...register("fundUsage")}
          />
          {errors.fundUsage && <ErrorMessage>{errors.fundUsage.message}</ErrorMessage>}
          <p className="text-xs text-gray-500 mt-1">
            Explica exactamente cómo se usarán los fondos (ej: 40% desarrollo, 30% marketing, 20% operaciones, 10% reservas)
          </p>
        </div>
      </div>

      {/* Consejo Importante */}
      <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-4">
        <h5 className="text-sm font-medium text-yellow-300 mb-2 flex items-center gap-1">
          <TrendingUp className="w-4 h-4" />
          Consejo Financiero Importante
        </h5>
        <p className="text-xs text-yellow-200">
          <strong>Transparencia es clave:</strong> Los inversionistas analizarán cuidadosamente tu tokenomics. Asegúrate de que 
          los números sean realistas y bien fundamentados. El APY debe ser sostenible y el destino de fondos debe ser claro 
          y detallado. Considera consultar con expertos financieros antes de finalizar estos datos.
        </p>
      </div>
    </div>
  );
}