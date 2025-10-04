'use client';

// Force dynamic rendering - this page uses cookies and should not be prerendered
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@saasfly/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@saasfly/ui/card';
import { Input } from '@saasfly/ui/input';
import { Label } from '@saasfly/ui/label';
import {
  ArrowLeftIcon,
  UserIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';

interface ProfileEditData {
  name: string;
  email: string;
  image: string;
  kycLevel: 'basic' | 'advanced' | 'N/A';
  kycCompleted: boolean;
  fullName: string;
  phoneNumber: string;
  dateOfBirth: string;
  occupation: string;
  taxId: string;
  nationality: string;
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

      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionUser.walletAddress && {
            'x-thirdweb-address': sessionUser.walletAddress,
            'x-wallet-address': sessionUser.walletAddress,
            'x-user-address': sessionUser.walletAddress,
          }),
        },
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
          onClick={() => router.push('/profile')}
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

        {/* KYC Status Control */}
        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-500">
              <ShieldCheckIcon className="w-5 h-5" />
              Estado de KYC
            </CardTitle>
            <CardDescription>
              Marque esta opción si ha completado toda la información de KYC requerida
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="kycCompleted"
                  checked={formData.kycCompleted}
                  onChange={(e) => {
                    const isCompleted = e.target.checked;

                    // Validate required KYC fields if marking as completed
                    if (isCompleted) {
                      const kycFieldsFilled = formData.fullName?.trim() &&
                                             formData.phoneNumber?.trim() &&
                                             formData.nationality?.trim() &&
                                             formData.address?.country?.trim();

                      if (!kycFieldsFilled) {
                        toast.error('Complete todos los campos KYC requeridos antes de marcar como completado');
                        return;
                      }
                    }

                    setFormData(prev => ({
                      ...prev,
                      kycCompleted: isCompleted,
                      kycLevel: isCompleted ? 'basic' : 'N/A',
                    }));
                  }}
                  className="w-4 h-4 text-lime-600 bg-gray-100 border-gray-300 rounded focus:ring-lime-500"
                />
                <label htmlFor="kycCompleted" className="text-sm font-medium text-white">
                  KYC Básico completado - Estoy listo para invertir
                </label>
              </div>

              {formData.kycCompleted && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-400 text-sm font-medium">
                      ✅ KYC Básico verificado - Ahora puede participar en proyectos de inversión
                    </span>
                  </div>
                </div>
              )}

              {!formData.kycCompleted && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-yellow-400 text-sm font-medium">
                      ⚠️ Complete la información KYC para acceder a inversiones
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 mt-8">
        <Button
          variant="outline"
          onClick={() => router.push('/profile')}
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
