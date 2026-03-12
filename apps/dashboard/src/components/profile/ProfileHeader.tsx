import Link from 'next/link';
import { Button } from '@saasfly/ui/button';

export function ProfileHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h2 className="text-xl font-bold text-white">Información Personal</h2>
        <p className="text-gray-400 text-sm">Detalles de tu cuenta y estado de verificación</p>
      </div>
    </div>
  );
}
