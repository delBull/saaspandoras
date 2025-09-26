'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@saasfly/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@saasfly/ui/card';
import { Input } from '@saasfly/ui/input';
import { Label } from '@saasfly/ui/label';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  DocumentIcon,
  ShieldCheckIcon,
  UserIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import type { KYCData } from '@/types/admin';

interface KYCFormData extends Omit<KYCData, 'address'> {
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  acceptTerms: boolean;
}

export default function KYCPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sessionUser, setSessionUser] = useState<{walletAddress?: string} | null>(null);

  const [formData, setFormData] = useState<KYCFormData>({
    fullName: '',
    phoneNumber: '',
    dateOfBirth: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
    },
    taxId: '',
    nationality: '',
    occupation: '',
    acceptTerms: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Get session user
    const getSession = () => {
      try {
        const walletAddress = document.cookie
          .split('; ')
          .find(row => row.startsWith('wallet-address='))
          ?.split('=')[1];

        if (walletAddress) {
          setSessionUser({ walletAddress });
        }
      } catch (error) {
        console.error('Error getting session:', error);
      }
    };

    getSession();
  }, []);

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!formData.fullName?.trim()) newErrors.fullName = 'Nombre completo requerido';
      if (!formData.phoneNumber?.trim()) newErrors.phoneNumber = 'Teléfono requerido';
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Fecha de nacimiento requerida';

      // Validate date format and age (must be 18 or older)
      if (formData.dateOfBirth) {
        const birthDate = new Date(formData.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 18) newErrors.dateOfBirth = 'Debes ser mayor de 18 años';
      }
    }

    if (stepNumber === 2) {
      if (!formData.address?.street?.trim()) newErrors['address.street'] = 'Dirección requerida';
      if (!formData.address?.city?.trim()) newErrors['address.city'] = 'Ciudad requerida';
      if (!formData.address?.country?.trim()) newErrors['address.country'] = 'País requerido';
      if (!formData.nationality?.trim()) newErrors.nationality = 'Nacionalidad requerida';
    }

    if (stepNumber === 3) {
      if (!formData.acceptTerms) newErrors.acceptTerms = 'Debes aceptar los términos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(3) || !sessionUser?.walletAddress) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/profile/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: sessionUser.walletAddress,
          kycData: {
            fullName: formData.fullName,
            phoneNumber: formData.phoneNumber,
            dateOfBirth: formData.dateOfBirth,
            address: formData.address,
            taxId: formData.taxId,
            nationality: formData.nationality,
            occupation: formData.occupation,
          },
        }),
      });

      if (response.ok) {
        toast.success('KYC completado exitosamente');
        router.push('/profile');
      } else {
        toast.error('Error al procesar KYC');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const updateAddress = (field: keyof typeof formData.address, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
  };

  if (!sessionUser) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Acceso Denegado</CardTitle>
            <CardDescription>Necesitas estar conectado para acceder al KYC.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/profile')}
          className="mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Volver al perfil
        </Button>

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">KYC - Nivel Básico</h1>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <ShieldCheckIcon className="w-5 h-5 text-yellow-500" />
            Nivel Actual: N/A
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-2 mb-8">
          {[1, 2, 3].map((stepNumber) => (
            <React.Fragment key={stepNumber}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                  step >= stepNumber
                    ? 'bg-lime-500 text-zinc-900'
                    : 'bg-zinc-700 text-gray-400'
                }`}
              >
                {stepNumber}
              </div>
              {stepNumber < 3 && (
                <div
                  className={`w-12 h-1 ${step > stepNumber ? 'bg-lime-500' : 'bg-zinc-700'}`}
                ></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              Información Personal
            </CardTitle>
            <CardDescription>
              Proporciona tus datos personales básicos para la verificación KYC.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="fullName">Nombre Completo *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                className={errors.fullName ? 'border-red-500' : ''}
              />
              {errors.fullName && <p className="text-sm text-red-500 mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <Label htmlFor="phoneNumber">Número de Teléfono *</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                placeholder="+52 555 123 4567"
                className={errors.phoneNumber ? 'border-red-500' : ''}
              />
              {errors.phoneNumber && <p className="text-sm text-red-500 mt-1">{errors.phoneNumber}</p>}
            </div>

            <div>
              <Label htmlFor="dateOfBirth">Fecha de Nacimiento *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                className={errors.dateOfBirth ? 'border-red-500' : ''}
              />
              {errors.dateOfBirth && <p className="text-sm text-red-500 mt-1">{errors.dateOfBirth}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HomeIcon className="w-5 h-5" />
              Dirección y Documentación
            </CardTitle>
            <CardDescription>
              Proporciona tu dirección residencial y información adicional.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="street">Dirección *</Label>
              <Input
                id="street"
                value={formData.address?.street}
                onChange={(e) => updateAddress('street', e.target.value)}
                placeholder="Calle, número, colonia"
                className={errors['address.street'] ? 'border-red-500' : ''}
              />
              {errors['address.street'] && <p className="text-sm text-red-500 mt-1">{errors['address.street']}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Ciudad *</Label>
                <Input
                  id="city"
                  value={formData.address?.city}
                  onChange={(e) => updateAddress('city', e.target.value)}
                  className={errors['address.city'] ? 'border-red-500' : ''}
                />
                {errors['address.city'] && <p className="text-sm text-red-500 mt-1">{errors['address.city']}</p>}
              </div>
              <div>
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={formData.address?.state}
                  onChange={(e) => updateAddress('state', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country">País *</Label>
                <Input
                  id="country"
                  value={formData.address?.country}
                  onChange={(e) => updateAddress('country', e.target.value)}
                  className={errors['address.country'] ? 'border-red-500' : ''}
                />
                {errors['address.country'] && <p className="text-sm text-red-500 mt-1">{errors['address.country']}</p>}
              </div>
              <div>
                <Label htmlFor="postalCode">Código Postal</Label>
                <Input
                  id="postalCode"
                  value={formData.address?.postalCode}
                  onChange={(e) => updateAddress('postalCode', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nationality">Nacionalidad *</Label>
                <Input
                  id="nationality"
                  value={formData.nationality}
                  onChange={(e) => setFormData(prev => ({ ...prev, nationality: e.target.value }))}
                  className={errors.nationality ? 'border-red-500' : ''}
                />
                {errors.nationality && <p className="text-sm text-red-500 mt-1">{errors.nationality}</p>}
              </div>
              <div>
                <Label htmlFor="occupation">Ocupación</Label>
                <Input
                  id="occupation"
                  value={formData.occupation}
                  onChange={(e) => setFormData(prev => ({ ...prev, occupation: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="taxId">Número de Identificación Fiscal (RFC, CURP, etc.)</Label>
              <Input
                id="taxId"
                value={formData.taxId}
                onChange={(e) => setFormData(prev => ({ ...prev, taxId: e.target.value }))}
                placeholder="Opcional para verificación adicional"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DocumentIcon className="w-5 h-5" />
              Verificación Final
            </CardTitle>
            <CardDescription>
              Revisa toda tu información y acepta los términos para completar el KYC.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="bg-zinc-800/50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-white">Resumen de Información</h4>
              <div className="text-sm space-y-1 text-gray-300">
                <p><strong>Nombre:</strong> {formData.fullName}</p>
                <p><strong>Teléfono:</strong> {formData.phoneNumber}</p>
                <p><strong>Nacionalidad:</strong> {formData.nationality}</p>
                <p><strong>Dirección:</strong> {`${formData.address?.street}, ${formData.address?.city}, ${formData.address?.country}`}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="acceptTerms"
                checked={formData.acceptTerms}
                onChange={(e) => setFormData(prev => ({ ...prev, acceptTerms: e.target.checked }))}
                className="mt-1"
              />
              <label htmlFor="acceptTerms" className="text-sm">
                Acepto los términos y condiciones de verificación KYC. Comprendo que esta información será utilizada
                únicamente para fines de cumplimiento normativo y protección contra fraudes. *
              </label>
            </div>
            {errors.acceptTerms && <p className="text-sm text-red-500">{errors.acceptTerms}</p>}

            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
              <p className="text-sm text-blue-300">
                <CheckCircleIcon className="w-4 h-4 inline mr-2" />
                Una vez completado el KYC, tu nivel se actualizará a &apos;Básico&apos; y tendrás acceso a funciones adicionales
                de la plataforma como límites más altos y verificación prioritaria.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        {step > 1 && (
          <Button variant="outline" onClick={handleBack} disabled={loading}>
            Anterior
          </Button>
        )}

        <div className="ml-auto space-x-4">
          {step < 3 ? (
            <Button onClick={handleNext}>
              Siguiente
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} className="bg-lime-500 hover:bg-lime-600 text-zinc-900">
              {loading ? 'Procesando...' : 'Completar KYC'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
