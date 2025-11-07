import Link from 'next/link';
import { Button } from '@saasfly/ui/button';

export function ProfileHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h2 className="text-xl font-bold text-white">Información Personal</h2>
        <p className="text-gray-400 text-sm">Detalles de tu cuenta y estado de verificación</p>
      </div>
      <Link href="/profile/edit">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 text-gray-400 hover:text-white border-gray-600 hover:border-gray-500 w-full sm:w-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Editar Datos
        </Button>
      </Link>
    </div>
  );
}
