import { DashboardGate } from "@/components/layout/dashboard-gate";

// This is a placeholder for a real sidebar component
function Sidebar() {
  return (
    <div className="w-64 h-screen p-4 bg-gray-100 border-r">
      <h2 className="text-xl font-bold">Dashboard</h2>
      <nav className="mt-8">
        <ul>
          <li className="mt-2"><a href="/" className="text-gray-700 hover:text-black">Pandora's Pool</a></li>
          <li className="mt-2"><a href="/applicants" className="text-gray-700 hover:text-black">Applicants</a></li>
          {/* Admin section will be conditionally rendered here based on role */}
        </ul>
      </nav>
    </div>
  );
}

// This is a placeholder for a real header component
function Header() {
  return (
    <header className="p-4 border-b">
      <h1 className="text-lg font-semibold">Welcome</h1>
    </header>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardGate>
      <div className="flex">
        <Sidebar />
        <main className="flex-1">
          <Header />
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </DashboardGate>
  );
}
