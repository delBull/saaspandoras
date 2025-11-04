'use client';

import { notFound } from "next/navigation";
import { useState, useEffect } from "react";
import {
  ChartPieIcon,
  GlobeAltIcon,
  UsersIcon,
  ChatBubbleLeftIcon,
} from "@heroicons/react/24/outline";
import { ProjectNavigation } from "./components/ProjectNavigation";
import { ProjectContent } from "./components/ProjectContent";

// Type for project data
interface ProjectData {
  id: number | string;
  title: string;
  slug: string;
  logo_url?: string | null;
  cover_photo_url?: string | null;
  tagline?: string | null;
  description: string;
  business_category?: string | null;
  video_pitch?: string | null;
  website?: string | null;
  whitepaper_url?: string | null;
  twitter_url?: string | null;
  discord_url?: string | null;
  telegram_url?: string | null;
  linkedin_url?: string | null;
  target_amount?: string | number | null;
  total_valuation_usd?: string | number | null;
  token_type?: string | null;
  total_tokens?: string | number | null;
  tokens_offered?: string | number | null;
  token_price_usd?: string | number | null;
  estimated_apy?: string | null;
  yield_source?: string | null;
  lockup_period?: string | null;
  fund_usage?: string | null;
  team_members?: string | null;
  advisors?: string | null;
  token_distribution?: string | null;
  contract_address?: string | null;
  treasury_address?: string | null;
  legal_status?: string | null;
  valuation_document_url?: string | null;
  fiduciary_entity?: string | null;
  due_diligence_report_url?: string | null;
  is_mintable?: boolean | null;
  is_mutable?: boolean | null;
  update_authority_address?: string | null;
  applicant_name?: string | null;
  applicant_position?: string | null;
  applicant_email?: string | null;
  applicant_phone?: string | null;
  applicant_wallet_address?: string | null;
  verification_agreement?: boolean | null;
  image_url?: string | null;
  socials?: string | null;
  raised_amount?: string | number | null;
  returns_paid?: string | number | null;
  status: string;
  featured?: boolean | null;
  featured_button_text?: string | null;
  created_at?: string | Date | null;
}



// Helper para parsear JSON de forma segura
function safeJsonParse<T>(jsonString: string | null | undefined, defaultValue: T): T {
  if (!jsonString) return defaultValue;
  try {
    return JSON.parse(jsonString) as T;
  } catch (e) {
    return defaultValue;
  }
}

export default function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const [activeTab, setActiveTab] = useState('campaign');
  const [project, setProject] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load project data on mount
  useEffect(() => {
    const loadProject = async () => {
      try {
        const resolvedParams = await params;
        const response = await fetch(`/api/projects/${resolvedParams.slug}`);
        if (response.ok) {
          const projectData = await response.json() as ProjectData;
          setProject(projectData);
        } else {
          notFound();
        }
      } catch (error) {
        console.error('Error loading project:', error);
        notFound();
      } finally {
        setIsLoading(false);
      }
    };

    void loadProject();
  }, [params]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!project) {
    notFound();
  }

  // --- Conversión de datos segura ---
  const raisedAmount = Number(project.raised_amount ?? 0);
  const targetAmount = Number(project.target_amount ?? 1);

  const teamMembers: { name: string; position: string; linkedin?: string }[] = safeJsonParse(project.team_members as string | null, []);
  const advisors: { name: string; profile: string; linkedin?: string }[] = safeJsonParse(project.advisors as string | null, []);

  // El campo 'socials' no existe en el schema, se construye a partir de otros campos
  const socials = {
    twitter: project.twitter_url,
    email: project.applicant_email,
  };

  const allSocials = {
    website: project.website,
    twitter: project.twitter_url ?? socials.twitter,
    discord: project.discord_url,
    telegram: project.telegram_url,
    linkedin: project.linkedin_url,
  };

  const raisedPercentage = (raisedAmount / targetAmount) * 100;

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      {/* Navigation Header - Responsive */}
      <nav className="border-b border-zinc-800 backdrop-blur-sm top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 md:h-16">
            <div className="flex items-center gap-4 md:gap-8">
              <div className="hidden md:flex items-center gap-6">
                  <a href="/applicants" className="text-gray-300 hover:text-white transition-colors text-sm md:text-base">Explore</a>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
        {/* Main Layout with Sidebar */}
        <div className="relative">
          {/* Sidebar (Right side) - All cards in sequence */}
          <div className="hidden lg:block absolute right-0 top-0 w-72 h-full">
            {/* Non-sticky section - Investment & Creator cards */}
            <div className="space-y-6 mb-6">
              {/* Investment Card */}
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-white mb-2">
                    US ${raisedAmount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400 mb-4">
                    pledged of US ${targetAmount.toLocaleString()} goal
                  </div>

                  <div className="w-full bg-zinc-800 rounded-full h-3 mb-4">
                    <div
                      className="bg-lime-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(raisedPercentage, 100)}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-sm mb-6">
                    <span className="text-gray-400">1,000 backers</span>
                    <span className="text-gray-400">30 days to go</span>
                  </div>

                  <button className="w-full bg-lime-400 hover:bg-lime-500 text-black font-bold py-3 px-6 rounded-lg transition-colors mb-4">
                    GET THE NFT
                  </button>

                  <div className="flex justify-center gap-3 mb-4">
                    <button className="p-2 text-gray-400 hover:text-white transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button className="p-2 text-gray-400 hover:text-white transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/>
                      </svg>
                    </button>
                    <button className="p-2 text-gray-400 hover:text-white transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18.303 4.742a1 1 0 011.414 0l.707.707a1 1 0 010 1.414l-6.01 6.01a1 1 0 01-1.414 0l-3.536-3.536a1 1 0 010-1.414l.707-.707a1 1 0 011.414 0L14.95 10.05l5.353-5.308z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>

                  <div className="text-xs text-gray-400">
                    All or nothing. This project will only be funded if it reaches its goal by Sat, October 31 2020 11:59 PM UTC +00:00.
                  </div>
                </div>
              </div>

              {/* Project Creator Card */}
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Project by</h3>
                <div className="text-center">
                  <div className="w-16 h-16 bg-zinc-800 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">IMG</span>
                  </div>
                  <div className="text-white font-medium mb-1">Company name</div>
                  <div className="text-gray-400 text-sm mb-3">First created</div>
                  <div className="text-gray-400 text-sm mb-4">0 backed</div>
                  <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2 px-4 rounded-lg transition-colors text-sm">
                    See more
                  </button>
                </div>
              </div>
            </div>

            {/* Sticky section - Tokenomics & Offers (from here down) */}
            <div className="sticky top-6 space-y-6">
              {/* Tokenomics */}
              {project.total_tokens && project.tokens_offered && (
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <ChartPieIcon className="w-5 h-5 text-lime-400" /> Tokenomics
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Supply Total</span>
                      <span className="text-white font-mono">{project.total_tokens.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tokens Ofrecidos</span>
                      <span className="text-white font-mono">{project.tokens_offered.toLocaleString()}</span>
                    </div>
                    {project.token_price_usd && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Precio por Token</span>
                        <span className="text-lime-400 font-mono">${Number(project.token_price_usd).toFixed(6)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Token Offers Panel */}
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <ChartPieIcon className="w-5 h-5 text-blue-400" /> Ofertas de Tokens
                </h3>
                <div className="space-y-4">
                  {/* Token Offer 1 */}
                  <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-white font-medium">Ronda Privada</h4>
                        <p className="text-gray-400 text-sm">Mínimo 10,000 tokens</p>
                      </div>
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">Activa</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Precio:</span>
                      <span className="text-lime-400 font-mono">$0.0003</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Disponibles:</span>
                      <span className="text-white font-mono">500,000</span>
                    </div>
                    <button className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium">
                      Comprar Tokens
                    </button>
                  </div>

                  {/* Token Offer 2 */}
                  <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-white font-medium">Ronda Pública</h4>
                        <p className="text-gray-400 text-sm">Mínimo 1,000 tokens</p>
                      </div>
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">Próxima</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Precio:</span>
                      <span className="text-lime-400 font-mono">$0.0005</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Disponibles:</span>
                      <span className="text-white font-mono">1,000,000</span>
                    </div>
                    <button className="w-full mt-3 bg-zinc-700 text-gray-400 py-2 px-4 rounded-lg text-sm font-medium cursor-not-allowed">
                      No Disponible
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area (Left side) */}
          <div className="lg:mr-80 xl:mr-80 2xl:mr-80">
            {/* Project Title and Description */}
            <div className="mb-8">
              <p className="text-sm text-gray-400 mb-2">{project.business_category ?? "Sin Categoría"}</p>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                {project.title}
              </h1>
              <p className="text-gray-300 text-lg">
                {project.tagline ?? "Insert short project description"}
              </p>
            </div>

            {/* Video Section */}
            {project.video_pitch && (
              <div className="mb-8">
                <div className="aspect-video bg-zinc-900 rounded-xl overflow-hidden">
                  {(() => {
                    console.log('🎥 ProjectPage: Processing video URL:', project.video_pitch);
                    let embedUrl = '';

                    if (project.video_pitch.includes('youtube.com') || project.video_pitch.includes('youtu.be')) {
                      console.log('🎥 ProjectPage: Detected YouTube URL');
                      let videoId = '';
                      if (project.video_pitch.includes('youtube.com')) {
                        const vParam = project.video_pitch.split('v=')[1];
                        videoId = vParam?.split('&')[0] ?? '';
                        console.log('🎥 ProjectPage: YouTube video ID from youtube.com:', videoId);
                      } else if (project.video_pitch.includes('youtu.be/')) {
                        const pathSegment = project.video_pitch.split('/').pop();
                        videoId = pathSegment?.split('?')[0] ?? '';
                        console.log('🎥 ProjectPage: YouTube video ID from youtu.be:', videoId);
                      }

                      if (videoId && videoId.length > 0) {
                        embedUrl = `https://www.youtube.com/embed/${videoId}`;
                        console.log('🎥 ProjectPage: Generated YouTube embed URL:', embedUrl);
                      }
                    } else if (project.video_pitch.includes('vimeo.com')) {
                      console.log('🎥 ProjectPage: Detected Vimeo URL');
                      const videoId = project.video_pitch.split('/').pop();
                      if (videoId) {
                        embedUrl = `https://player.vimeo.com/video/${videoId}`;
                        console.log('🎥 ProjectPage: Generated Vimeo embed URL:', embedUrl);
                      }
                    }

                    if (embedUrl) {
                      return (
                        <iframe
                          src={embedUrl}
                          title={`${project.title} Video Pitch`}
                          className="w-full h-full"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          referrerPolicy="strict-origin-when-cross-origin"
                        />
                      );
                    } else {
                      console.log('🎥 ProjectPage: No valid embed URL generated, showing fallback');
                      return (
                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                          <div className="text-center">
                            <p className="text-gray-400 mb-2">URL del video inválida</p>
                            <p className="text-xs text-gray-500">URL recibida: {project.video_pitch}</p>
                          </div>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            )}

            {/* Project Navigation Component */}
            <ProjectNavigation
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            {/* Dynamic Project Content */}
            <ProjectContent activeTab={activeTab} />
          </div>


          {/* Mobile Investment Card - Show only on mobile */}
          <div className="lg:hidden mb-8">
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-white mb-2">
                  US ${raisedAmount.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400 mb-4">
                  pledged of US ${targetAmount.toLocaleString()} goal
                </div>

                <div className="w-full bg-zinc-800 rounded-full h-3 mb-4">
                  <div
                    className="bg-lime-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(raisedPercentage, 100)}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-sm mb-6">
                  <span className="text-gray-400">1,000 backers</span>
                  <span className="text-gray-400">30 days to go</span>
                </div>

                <button className="w-full bg-lime-400 hover:bg-lime-500 text-black font-bold py-3 px-6 rounded-lg transition-colors mb-4">
                  GET THE NFT
                </button>

                <div className="flex justify-center gap-3 mb-4">
                  <button className="p-2 text-gray-400 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button className="p-2 text-gray-400 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/>
                    </svg>
                  </button>
                  <button className="p-2 text-gray-400 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18.303 4.742a1 1 0 011.414 0l.707.707a1 1 0 010 1.414l-6.01 6.01a1 1 0 01-1.414 0l-3.536-3.536a1 1 0 010-1.414l.707-.707a1 1 0 011.414 0L14.95 10.05l5.353-5.308z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                <div className="text-xs text-gray-400">
                  All or nothing. This project will only be funded if it reaches its goal by Sat, October 31 2020 11:59 PM UTC +00:00.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Content Sections */}
        <div className="relative">
          {/* Left Column - Project Details */}
          <div className="lg:mr-80 xl:mr-80 2xl:mr-80 space-y-8">
            {/* Social Links */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <GlobeAltIcon className="w-5 h-5 text-lime-400" /> Comunidades y Enlaces
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {allSocials.website && (
                  <a href={allSocials.website} target="_blank" rel="noopener noreferrer"
                     className="p-4 bg-zinc-800 rounded-xl border border-zinc-700 hover:border-lime-400 hover:bg-zinc-700 transition-all duration-300 group">
                    <div className="flex items-center gap-3">
                      <GlobeAltIcon className="w-5 h-5 text-lime-400" />
                      <span className="font-medium text-white">Sitio Web</span>
                    </div>
                  </a>
                )}
                {allSocials.twitter && (
                  <a href={allSocials.twitter} target="_blank" rel="noopener noreferrer"
                     className="p-4 bg-zinc-800 rounded-xl border border-zinc-700 hover:border-blue-400 hover:bg-zinc-700 transition-all duration-300 group">
                    <div className="flex items-center gap-3">
                      <ChatBubbleLeftIcon className="w-5 h-5 text-blue-400" />
                      <span className="font-medium text-white">Twitter</span>
                    </div>
                  </a>
                )}
                {allSocials.discord && (
                  <a href={allSocials.discord} target="_blank" rel="noopener noreferrer"
                     className="p-4 bg-zinc-800 rounded-xl border border-zinc-700 hover:border-indigo-400 hover:bg-zinc-700 transition-all duration-300 group">
                    <div className="flex items-center gap-3">
                      <ChatBubbleLeftIcon className="w-5 h-5 text-indigo-400" />
                      <span className="font-medium text-white">Discord</span>
                    </div>
                  </a>
                )}
              </div>
            </div>

            {/* Team Section */}
            {(teamMembers.length > 0 || advisors.length > 0) && (
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <UsersIcon className="w-5 h-5 text-lime-400" /> Equipo y Asesores
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {teamMembers.map((member, index: number) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-lime-500 to-emerald-500 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-white font-bold text-sm">{member.name?.charAt(0)}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-sm">{member.name}</h4>
                        <p className="text-gray-400 text-xs mb-1">{member.position}</p>
                        {member.linkedin && (
                          <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-lime-400 text-xs hover:underline">
                            LinkedIn →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                  {advisors.map((advisor, index: number) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-white font-bold text-sm">{advisor.name?.charAt(0)}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-sm">{advisor.name}</h4>
                        <p className="text-gray-400 text-xs">{advisor.profile ?? 'Asesor'}</p>
                        {advisor.linkedin && (
                          <a href={advisor.linkedin} target="_blank" rel="noopener noreferrer" className="text-emerald-400 text-xs hover:underline">
                            LinkedIn →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Tokenomics Panel */}
          <div className="lg:hidden space-y-6">
            {/* Tokenomics */}
            {project.total_tokens && project.tokens_offered && (
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <ChartPieIcon className="w-5 h-5 text-lime-400" /> Tokenomics
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Supply Total</span>
                    <span className="text-white font-mono">{project.total_tokens.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tokens Ofrecidos</span>
                    <span className="text-white font-mono">{project.tokens_offered.toLocaleString()}</span>
                  </div>
                  {project.token_price_usd && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Precio por Token</span>
                      <span className="text-lime-400 font-mono">${Number(project.token_price_usd).toFixed(6)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Token Offers Panel - Mobile */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <ChartPieIcon className="w-5 h-5 text-blue-400" /> Ofertas de Tokens
              </h3>
              <div className="space-y-4">
                <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-white font-medium">Ronda Privada</h4>
                      <p className="text-gray-400 text-sm">Mínimo 10,000 tokens</p>
                    </div>
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">Activa</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Precio:</span>
                    <span className="text-lime-400 font-mono">$0.0003</span>
                  </div>
                  <button className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium">
                    Comprar Tokens
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Projects Section */}
        <div className="relative">
          {/* Left Column - Recommended Projects */}
          <div className="lg:mr-80 xl:mr-80 2xl:mr-80">
            <div className="border-t border-zinc-800 pt-16 mt-10">
              <h2 className="text-2xl font-bold text-white mb-8">WE ALSO RECOMMEND</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden hover:border-zinc-700 transition-colors">
                    <div className="aspect-video bg-zinc-800 flex items-center justify-center">
                      <span className="text-gray-400">IMG</span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-white mb-2">Project Title</h3>
                      <p className="text-gray-400 text-sm mb-3">Insert short project description here.</p>
                      <div className="text-gray-400 text-sm">By Company Name</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
