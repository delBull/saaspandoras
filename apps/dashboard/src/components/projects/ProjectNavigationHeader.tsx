'use client';

export default function ProjectNavigationHeader() {
  return (
    <nav className="backdrop-blur-sm top-0 z-50 relative">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 md:h-16">
          <div className="flex items-center gap-4 md:gap-8">
            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={() => window.history.back()}
                className="text-gray-300 hover:text-white transition-colors text-sm md:text-base flex items-center gap-2"
              >
                <span>←</span> Volver
              </button>
              <div className="h-4 w-px bg-zinc-700"></div>
              <a href="/applicants" className="text-gray-300 hover:text-white transition-colors text-sm md:text-base">Explorar</a>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
          </div>
        </div>
      </div>
    </nav>
  );
}