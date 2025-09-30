'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@saasfly/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@saasfly/ui/card';
import { Input } from '@saasfly/ui/input';
import { Label } from '@saasfly/ui/label';
import {
  ArrowLeftIcon,
  UserIcon,
  HomeIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';

interface ProfileEditData {
  // Basic profile data
  name: string;
  email: string;
  image: string;

  // KYC data
  kycLevel: 'basic' | 'advanced' | 'N/A';
  kycCompleted: boolean;
  fullName: string;
  phoneNumber: string;
  dateOfBirth: string;
  occupation: string;
  taxId: string;
  nationality: string;

  // Address
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
}

export default function ProfileEditPage() {
  const router = useRouter();
  const { profile, isLoading, isError, mutate } = useProfile();
  const [sessionUser, setSessionUser] = useState<{walletAddress?: string} | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<ProfileEditData>({
    name: '',
    email: '',
    image: '',
    kycLevel: 'basic',
    kycCompleted: false,
    fullName: '',
    phoneNumber: '',
    dateOfBirth: '',
    occupation: '',
    taxId: '',
    nationality: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
    },
  });

  useEffect(() => {
    // Get session user first
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

  // Populate form data when profile loads
  useEffect(() => {
    if (profile && sessionUser?.walletAddress) {
      const kycData = profile.kycData ?? {};

      setFormData({
        name: profile.name ?? '',
        email: profile.email ?? '',
        image: profile.image ?? '',
        kycLevel: profile.kycLevel ?? 'basic',
        kycCompleted: profile.kycCompleted ?? false,
        fullName: kycData.fullName ?? '',
        phoneNumber: kycData.phoneNumber ?? '',
        dateOfBirth: kycData.dateOfBirth ?? '',
        occupation: kycData.occupation ?? '',
        taxId: kycData.taxId ?? '',
        nationality: kycData.nationality ?? '',
        address: kycData.address ?? {
          street: '',
          city: '',
          state: '',
          country: '',
          postalCode: '',
        },
      });
    }
  }, [profile, sessionUser]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Basic validation
    if (!formData.name?.trim()) newErrors.name = 'Nombre requerido';
    if (!formData.email?.trim()) newErrors.email = 'Email requerido';
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18) newErrors.dateOfBirth = 'Debes ser mayor de 18 años';
    }

    if (formData.kycCompleted) {
      if (!formData.fullName?.trim()) newErrors.fullName = 'Nombre completo requerido para KYC';
      if (!formData.phoneNumber?.trim()) newErrors.phoneNumber = 'Teléfono requerido para KYC';
      if (!formData.nationality?.trim()) newErrors.nationality = 'Nacionalidad requerida para KYC';
      if (!formData.address?.country?.trim()) newErrors['address.country'] = 'País requerido para KYC';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    console.log('🎛️ handleSubmit called - starting form submission');
    console.log('📝 Form data to submit:', formData);

    // Check validations
    const validationPassed = validateForm();
    console.log('✅ Validations passed:', validationPassed);

    const hasSessionUser = !!sessionUser?.walletAddress;
    console.log('👤 Has session user:', hasSessionUser, 'Wallet:', sessionUser?.walletAddress);

    if (!validationPassed || !hasSessionUser) {
      console.log('❌ Validation failed or no session user - showing error toast');
      toast.error('Revisa los campos requeridos');
      return;
    }

    console.log('🚀 Starting API call...');
    setLoading(true);
    try {
      const requestBody = {
        walletAddress: sessionUser.walletAddress,
        profileData: formData,
      };
      console.log('📤 Request body:', requestBody);

      const response = await fetch('/api/profile/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log('📦 API response status:', response.status, response.ok ? 'SUCCESS' : 'FAILED');

      if (response.ok) {
        console.log('🎉 API call successful - updating profile');
        toast.success('Perfil actualizado exitosamente');

        // Force immediate revalidation and update cache
        console.log('🔄 Forcing immediate profile data refresh...');
        await mutate(async () => fetch('/api/profile').then(res => res.json()), {
          revalidate: true
        });
        console.log('✅ Data refresh completed');

        console.log('📱 Navigating to profile...');
        router.push('/profile');
      } else {
        const errorMessage = await response.text();
        console.error('❌ API call failed with response:', response.status, errorMessage);
        toast.error('Error al actualizar perfil');
      }
    } catch (error) {
      console.error('💥 Error in fetch:', error);
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

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-zinc-700 rounded mb-4 w-64"></div>
          <div className="space-y-4">
            <div className="h-48 bg-zinc-700 rounded"></div>
            <div className="h-32 bg-zinc-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !sessionUser) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Acceso Denegado</CardTitle>
            <CardDescription>Necesitas estar conectado para editar tu perfil.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => window.location.href = '/profile'}
          className="mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Volver al perfil
        </Button>

        <h1 className="text-2xl font-bold text-white">Editar Perfil</h1>
        <p className="text-gray-400">Actualiza tu información personal y datos de verificación KYC</p>
      </div>

      <div className="space-y-6">
        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheckIcon className="w-5 h-5" />
              Estado Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  profile?.kycLevel === 'basic' ? 'bg-green-500' : 'bg-yellow-500'
                }`}></div>
                <div>
                  <p className="text-sm font-medium text-gray-400">Nivel KYC</p>
                  <p className="text-white">{profile?.kycLevel === 'basic' ? 'Básico' : 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  profile?.kycCompleted ? 'bg-green-500' : 'bg-yellow-500'
                }`}></div>
                <div>
                  <p className="text-sm font-medium text-gray-400">Verificación</p>
                  <p className="text-white">{profile?.kycCompleted ? 'Completa' : 'Pendiente'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-400">Rol</p>
                <p className="text-white capitalize">{profile?.role ?? 'pandorian'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              Información Básica
            </CardTitle>
            <CardDescription>
              Datos personales y de contacto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="image">URL de Imagen de Perfil</Label>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div>
              <Label htmlFor="occupation">Ocupación</Label>
              <Input
                id="occupation"
                value={formData.occupation}
                onChange={(e) => setFormData(prev => ({ ...prev, occupation: e.target.value }))}
                placeholder="Profesión o actividad"
              />
            </div>

            <div>
              <Label htmlFor="taxId">ID Fiscal / RFC</Label>
              <Input
                id="taxId"
                value={formData.taxId}
                onChange={(e) => setFormData(prev => ({ ...prev, taxId: e.target.value }))}
                placeholder="Número de identificación fiscal"
              />
            </div>
          </CardContent>
        </Card>

        {/* KYC Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheckIcon className="w-5 h-5" />
              Información KYC
            </CardTitle>
            <CardDescription>
              Datos de verificación de identidad (requeridos para inversiones)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">{formData.kycCompleted ? 'Nombre Completo *' : 'Nombre Completo'}</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className={errors.fullName ? 'border-red-500' : ''}
                />
                {errors.fullName && <p className="text-sm text-red-500 mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <Label htmlFor="phoneNumber">{formData.kycCompleted ? 'Teléfono *' : 'Teléfono'}</Label>
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateOfBirth">Fecha de Nacimiento</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  className={errors.dateOfBirth ? 'border-red-500' : ''}
                />
                {errors.dateOfBirth && <p className="text-sm text-red-500 mt-1">{errors.dateOfBirth}</p>}
              </div>

              <div>
                <Label htmlFor="nationality">{formData.kycCompleted ? 'Nacionalidad *' : 'Nacionalidad'}</Label>
                <Input
                  id="nationality"
                  value={formData.nationality}
                  onChange={(e) => setFormData(prev => ({ ...prev, nationality: e.target.value }))}
                  className={errors.nationality ? 'border-red-500' : ''}
                />
                {errors.nationality && <p className="text-sm text-red-500 mt-1">{errors.nationality}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HomeIcon className="w-5 h-5" />
              Dirección
            </CardTitle>
            <CardDescription>
              Dirección residencial completa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="street">{formData.kycCompleted ? 'Dirección *' : 'Dirección'}</Label>
              <Input
                id="street"
                value={formData.address?.street}
                onChange={(e) => updateAddress('street', e.target.value)}
                placeholder="Calle, número, colonia"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  value={formData.address?.city}
                  onChange={(e) => updateAddress('city', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="state">Estado / Provincia</Label>
                <Input
                  id="state"
                  value={formData.address?.state}
                  onChange={(e) => updateAddress('state', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country">{formData.kycCompleted ? 'País *' : 'País'}</Label>
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
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 mt-8">
        <Button
          variant="outline"
          onClick={() => window.location.href = '/profile'}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-lime-500 hover:bg-lime-600 text-black"
        >
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
    </div>
  );
}
