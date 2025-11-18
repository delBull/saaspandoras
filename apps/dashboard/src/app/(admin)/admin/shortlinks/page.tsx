// Page for managing custom shortlinks
// Separate from analytics page

import { ShortlinksManager } from '@/components/admin/ShortlinksManager';

export default function ShortlinksManagementPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ShortlinksManager />
    </div>
  );
}
