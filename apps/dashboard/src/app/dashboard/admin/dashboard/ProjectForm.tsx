"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod"; // Temporarily disabled for compatibility
import { z } from "zod";
import { toast } from "sonner";
import { type projects } from "~/db/schema";

import { Loader2 } from "lucide-react";

// Componentes UI básicos para evitar dependencias problemáticas
const Button = ({ children, className = "", onClick, type = "button", disabled = false }: { children: React.ReactNode, className?: string, onClick?: () => void, type?: "button" | "submit", disabled?: boolean }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 ${className}`}
  >
    {children}
  </button>
);

const Input = ({ id, type = "text", className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    id={id}
    type={type}
    className={`w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent ${className}`}
    {...props}
  />
);

const Textarea = ({ id, className = "", rows = 3, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    id={id}
    rows={rows}
    className={`w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent resize-vertical ${className}`}
    {...props}
  />
);

const Label = ({ htmlFor, children }: { htmlFor?: string, children: React.ReactNode }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-300 mb-1">
    {children}
  </label>
);

type Project = typeof projects.$inferSelect;

const projectSchema = z.object({
  title: z.string().min(3, "El título es requerido."),
  description: z.string().min(10, "La descripción es requerida."),
  website: z.string().url("URL inválida.").optional().or(z.literal("")),
  businessCategory: z.string().optional(),
  targetAmount: z.coerce.number().min(0, "Debe ser un número positivo."),
  status: z.enum(["draft", "pending", "approved", "live", "completed", "incomplete", "rejected"]),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  project: Project | null;
}

export function ProjectForm({ project }: ProjectFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isNew = project === null;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormData>({
    // resolver: zodResolver(projectSchema), // Temporarily disabled for compatibility
    mode: 'onChange',
    defaultValues: {
      title: project?.title ?? "",
      description: project?.description ?? "",
      website: project?.website ?? "",
      businessCategory: project?.businessCategory ?? "",
      targetAmount: Number(project?.targetAmount ?? 0),
      status: project?.status ?? "pending",
    },
  });

  const onSubmit = async (data: ProjectFormData) => {
    setIsLoading(true);
    const endpoint = isNew
      ? "/api/admin/projects"
      : `/api/admin/projects/${project.id}`;
    const method = isNew ? "POST" : "PUT";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("La solicitud falló.");

      toast.success(
        `Proyecto ${isNew ? "creado" : "actualizado"} exitosamente.`
      );
      router.push("/admin/dashboard");
      router.refresh();
    } catch (error) {
      toast.error("Ocurrió un error al guardar el proyecto.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Campos del formulario */}
      <div>
        <Label htmlFor="title">Título del Proyecto</Label>
        <Input id="title" {...register("title")} className="bg-zinc-800" />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <Textarea id="description" {...register("description")} className="bg-zinc-800 min-h-[120px]" />
        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="website">Sitio Web</Label>
          <Input id="website" {...register("website")} className="bg-zinc-800" />
          {errors.website && <p className="text-red-500 text-xs mt-1">{errors.website.message}</p>}
        </div>
        <div>
          <Label htmlFor="targetAmount">Monto a Recaudar (USD)</Label>
          <Input id="targetAmount" type="number" {...register("targetAmount")} className="bg-zinc-800" />
          {errors.targetAmount && <p className="text-red-500 text-xs mt-1">{errors.targetAmount.message}</p>}
        </div>
      </div>

      {/* ... más campos como category, apy, etc. se pueden añadir aquí ... */}

      <Button type="submit" disabled={isLoading} className="w-full bg-lime-500 hover:bg-lime-600 text-zinc-900 font-bold py-3">
        {isLoading ? <Loader2 className="animate-spin" /> : (isNew ? "Crear y Aprobar Proyecto" : "Guardar Cambios")}
      </Button>
    </form>
  );
}
