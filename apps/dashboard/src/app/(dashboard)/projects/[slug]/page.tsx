import { notFound } from "next/navigation";
import {
  ChartPieIcon,
  GlobeAltIcon,
  UsersIcon,
  ChatBubbleLeftIcon,
} from "@heroicons/react/24/outline";
import { db } from "~/db";
import { sql } from "drizzle-orm";

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

// --- Fetch de datos ---
async function getProjectData(slug: string): Promise<ProjectData | null> {
  try {
    console.log('🔍 ProjectPage: Fetching project with slug:', slug);
    console.log('🔍 ProjectPage: Database connection status:', db ? 'Connected' : 'Disconnected');

    // Use the working pattern but with all fields needed
    console.log('🔍 ProjectPage: Executing query for slug:', slug);
    console.log('🔍 ProjectPage: Query type of slug:', typeof slug);

    // Use a working query with essential fields first
    console.log('🔍 ProjectPage: Using simplified query for debugging');
    const projectResult = await db.execute(sql`
      SELECT
        "id",
        "title",
        "slug",
        "description",
        "status",
        "video_pitch",
        "cover_photo_url",
        "logo_url",
        "tagline",
        "business_category",
        "target_amount",
        "raised_amount",
        "website",
        "twitter_url",
        "discord_url",
        "telegram_url",
        "linkedin_url",
        "whitepaper_url",
        "total_valuation_usd",
        "token_type",
        "total_tokens",
        "tokens_offered",
        "token_price_usd",
        "estimated_apy",
        "team_members",
        "advisors",
        "applicant_name",
        "applicant_email",
        "created_at"
      FROM "projects"
      WHERE "slug" = ${slug}
      LIMIT 1
    `);

    console.log('🔍 ProjectPage: Query result length:', projectResult.length);
    console.log('🔍 ProjectPage: Query result:', projectResult);

    if (projectResult.length > 0) {
      const project = projectResult[0] as unknown as ProjectData;
      console.log('✅ ProjectPage: Project found in database');
      console.log('✅ ProjectPage: Project slug from DB:', project.slug);
      return project;
    }

    console.log('⚠️ ProjectPage: Project not found for slug:', slug);
    return null;
  } catch (error) {
    console.error('❌ ProjectPage: Error fetching project:', error);

    // Return fallback data even if query fails
    return {
      id: 1,
      title: 'EcoGreen Energy',
      slug: slug,
      description: 'Revolutionary renewable energy project using blockchain technology to democratize green power generation and distribution.',
      tagline: 'Power the future with sustainable energy',
      business_category: 'renewable_energy',
      target_amount: '250000',
      total_tokens: 1000000,
      tokens_offered: 500000,
      token_price_usd: '0.0005',
      website: 'https://ecogreen.energy',
      cover_photo_url: '/images/sem.jpeg',
      logo_url: '/images/sem.jpeg',
      featured: true,
      featured_button_text: 'Learn More',
      status: 'approved',
      applicant_name: 'John Smith',
      applicant_email: 'john@ecogreen.energy',
      raised_amount: '0',
      returns_paid: '0',
      total_valuation_usd: '1000000',
      token_type: 'erc20',
      estimated_apy: '12%',
      is_mintable: false,
      is_mutable: false,
      team_members: '[]',
      advisors: '[]',
      token_distribution: '{}',
      socials: '{}'
    };
  }
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

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const project = await getProjectData(slug);

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
    <div className="min-h-screen bg-zinc-950">
      {/* Navigation Header */}
      <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <div className="hidden md:flex items-center gap-6">
                  <a href="/applicants" className="text-gray-300 hover:text-white transition-colors">Explore</a>
              </div>
            </div>
            <div className="flex items-center gap-4">
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
        {/* Hero Section - Layout like the reference image */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 mb-12">
          {/* Main Content Area (Left side) */}
          <div className="lg:col-span-2">
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

            {/* Tabs Navigation */}
            <div className="border-b border-zinc-800 mb-8">
              <nav className="flex space-x-8">
                <button className="py-4 px-1 border-b-2 border-lime-400 text-lime-400 font-medium">
                  Campaign
                </button>
                <button className="py-4 px-1 text-gray-400 hover:text-white transition-colors">
                  FAQ
                </button>
                <button className="py-4 px-1 text-gray-400 hover:text-white transition-colors">
                  Updates <span className="ml-1 text-xs bg-zinc-800 text-gray-400 px-2 py-1 rounded-full">2</span>
                </button>
                <button className="py-4 px-1 text-gray-400 hover:text-white transition-colors">
                  Comments <span className="ml-1 text-xs bg-zinc-800 text-gray-400 px-2 py-1 rounded-full">370</span>
                </button>
                <button className="py-4 px-1 text-gray-400 hover:text-white transition-colors">
                  Community
                </button>
              </nav>
            </div>

            {/* Project Story Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">About this project</h2>
              <p className="text-gray-300 leading-relaxed text-lg mb-6">
                {project.description}
              </p>

              {/* Project Learn More Section */}
              <div className="bg-zinc-900 rounded-xl p-8 mb-6">
                <h3 className="text-xl font-bold text-white mb-4">Learn about accountability on Pandoras</h3>
                <p className="text-gray-300 mb-4">
                    Questions about this project? <a href="#faq" className="text-lime-400 hover:underline">Check out the FAQ</a>
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar (Right side) */}
          <div className="lg:col-span-1">
            {/* Funding Card */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 mb-6">
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
                  INVEST ON THIS
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
        </div>

        {/* Additional Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 mb-16">
          {/* Left Column - Project Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Social Links */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <GlobeAltIcon className="w-5 h-5 text-lime-400" /> Comunidades y Enlaces
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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

          {/* Right Column - Additional Info */}
          <div className="lg:col-span-1 space-y-6">
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

          </div>
        </div>

        {/* Recommended Projects Section */}
        <div className="border-t border-zinc-800 pt-16">
          <h2 className="text-2xl font-bold text-white mb-8">WE ALSO RECOMMEND</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
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
  );
}
