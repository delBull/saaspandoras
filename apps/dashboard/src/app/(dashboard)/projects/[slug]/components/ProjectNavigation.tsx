'use client';

import { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface ProjectNavigationProps {
  className?: string;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export function ProjectNavigation({ className = '', activeTab = 'campaign', onTabChange }: ProjectNavigationProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const mainTabs = [
    { id: 'campaign', label: 'Campaign' },
    { id: 'faq', label: 'FAQ' },
    { id: 'updates', label: 'Updates', count: 2 },
  ];

  const dropdownTabs = [
    { id: 'comments', label: 'Comments', count: 370 },
    { id: 'community', label: 'Community' },
  ];

  const handleTabClick = (tabId: string) => {
    setIsDropdownOpen(false);
    onTabChange?.(tabId);
  };

  return (
    <div className={`border-b border-zinc-800 mb-8 ${className}`}>
      <nav className="flex space-x-2 md:space-x-8 overflow-x-auto">
        {/* Main tabs - visible on all screens */}
        {mainTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`py-4 px-2 md:px-1 whitespace-nowrap text-sm md:text-base transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-lime-400 text-lime-400 font-medium'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
            {tab.count && (
              <span className="ml-1 text-xs bg-zinc-800 text-gray-400 px-1.5 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}

        {/* Dropdown for additional tabs - mobile only */}
        <div className="relative md:hidden">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="py-4 px-2 text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1"
          >
            <ChevronDownIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Desktop view - show all tabs */}
        <div className="hidden md:flex space-x-8">
          {dropdownTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`py-4 px-1 whitespace-nowrap text-sm md:text-base transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-lime-400 text-lime-400 font-medium'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
              {tab.count && (
                <span className="ml-1 text-xs bg-zinc-800 text-gray-400 px-1.5 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Dropdown menu - positioned as overlay */}
      {isDropdownOpen && (
        <div className="fixed inset-0 z-50 md:hidden pointer-events-none">
          <div className="absolute top-[290px] right-4 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl min-w-40 pointer-events-auto">
            {dropdownTabs.map((tab) => (
              <button
                key={tab.id}
                className="w-full text-left px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-zinc-800 transition-colors first:rounded-t-lg last:rounded-b-lg"
                onClick={() => handleTabClick(tab.id)}
              >
                {tab.label}
                {tab.count && (
                  <span className="ml-1 text-xs bg-zinc-800 text-gray-400 px-1.5 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setIsDropdownOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsDropdownOpen(false);
            }
          }}
          role="button"
          tabIndex={-1}
          aria-label="Close dropdown"
        />
      )}
    </div>
  );
}
