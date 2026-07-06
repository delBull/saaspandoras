import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import PrintButton from './PrintButton';
import type { Components } from 'react-markdown';

// Force dynamic to always fetch the latest DB config
export const dynamic = 'force-dynamic';

export default async function UniversalDocumentPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ slug: string, docType: string }>,
  searchParams: Promise<{ lang?: string }>
}) {
  const resolvedParams = await params;
  const { slug, docType } = resolvedParams;
  const resolvedSearch = await searchParams;
  const lang = resolvedSearch.lang === 'en' ? 'en' : 'es';

  const validTypes = ['dossier', 'one-pager', 'deck'];
  if (!validTypes.includes(docType)) {
    notFound();
  }

  // Fetch project config
  const [project] = await db
    .select({ title: projects.title, extraConfig: projects.extraConfig })
    .from(projects)
    .where(eq(projects.slug, slug));

  if (!project) {
    notFound();
  }

  const docs = (project.extraConfig as any)?.resourceHub?.markdownDocs || {};
  
  const keyPrefix = docType === 'one-pager' ? 'one_pager' : docType;
  const key = `${keyPrefix}_${lang}`;

  let markdownContent = docs[key];

  if (!markdownContent) {
    markdownContent = `# Documento no encontrado\n\nEl documento solicitado aún no ha sido configurado para este idioma.`;
  }

  // --- DESIGN SYSTEM: DOSSIER (Editorial, Elegante, Legal) ---
  const dossierComponents: Components = {
    h1: ({node, ...props}) => <h1 className="text-4xl md:text-5xl uppercase tracking-wider text-[#D4A853] mb-10 font-serif border-b border-white/10 pb-6 print:text-black print:border-black/10" {...props} />,
    h2: ({node, ...props}) => <h2 className="text-2xl md:text-3xl uppercase tracking-widest text-white mt-16 mb-6 font-serif flex items-center gap-4 before:content-[''] before:block before:w-12 before:h-px before:bg-[#D4A853] print:text-black" {...props} />,
    h3: ({node, ...props}) => <h3 className="text-xl tracking-wider text-[#D4A853] mt-8 mb-4 font-sans font-medium uppercase print:text-black" {...props} />,
    p: ({node, ...props}) => <p className="text-zinc-300 leading-relaxed font-light mb-6 text-lg text-justify print:text-black" {...props} />,
    blockquote: ({node, ...props}) => (
      <blockquote className="relative border-l-2 border-[#D4A853] pl-8 py-6 my-12 text-xl font-serif text-white/90 bg-gradient-to-r from-white/5 to-transparent rounded-r-3xl italic print:text-black print:bg-gray-100">
        <div className="absolute left-2 top-2 text-6xl text-[#D4A853]/20 font-serif leading-none print:text-[#D4A853]/40">"</div>
        {props.children}
      </blockquote>
    ),
    ul: ({node, ...props}) => <ul className="space-y-4 my-8 list-none pl-2" {...props} />,
    li: ({node, ...props}) => (
      <li className="flex items-start gap-4">
        <div className="w-1.5 h-1.5 rounded-full bg-[#D4A853] mt-2.5 shrink-0" />
        <span className="text-zinc-300 text-lg leading-relaxed font-light print:text-black">{props.children}</span>
      </li>
    ),
    strong: ({node, ...props}) => <strong className="text-white font-medium print:text-black" {...props} />,
    table: ({node, ...props}) => (
      <div className="overflow-x-auto my-12 rounded-2xl border border-white/10 bg-white/5 print:bg-white print:border-black/10">
        <table className="w-full text-left border-collapse" {...props} />
      </div>
    ),
    th: ({node, ...props}) => <th className="p-5 border-b border-white/10 text-xs uppercase tracking-widest text-[#D4A853] font-bold bg-black/40 print:bg-gray-100 print:text-black print:border-black/10" {...props} />,
    td: ({node, ...props}) => <td className="p-5 border-b border-white/5 text-zinc-300 font-light print:text-black print:border-black/5" {...props} />,
    img: ({node, ...props}) => (
      <div className="my-12 rounded-2xl overflow-hidden border border-white/10 shadow-2xl print:shadow-none print:border-black/10">
        <img className="w-full h-auto object-cover" {...props} alt={props.alt} />
      </div>
    )
  };

  // --- DESIGN SYSTEM: DECK (Institucional, Slide-like, Impactante) ---
  const deckComponents: Components = {
    h1: ({node, ...props}) => <h1 className="text-6xl md:text-7xl uppercase tracking-tighter text-white mb-12 font-sans font-black print:text-black" {...props} />,
    h2: ({node, ...props}) => <h2 className="text-4xl md:text-5xl tracking-tight text-[#D4A853] mt-24 mb-10 font-sans font-bold print:text-[#D4A853]" {...props} />,
    h3: ({node, ...props}) => <h3 className="text-2xl text-white mt-12 mb-6 font-sans font-medium print:text-black" {...props} />,
    p: ({node, ...props}) => <p className="text-zinc-300 leading-loose font-medium mb-8 text-xl md:text-2xl print:text-black" {...props} />,
    blockquote: ({node, ...props}) => (
      <blockquote className="border-4 border-[#D4A853] p-8 my-16 text-3xl font-sans font-bold text-center text-white bg-black rounded-3xl shadow-2xl shadow-[#D4A853]/10 print:text-black print:bg-white print:border-black">
        {props.children}
      </blockquote>
    ),
    ul: ({node, ...props}) => <ul className="space-y-6 my-10 list-none" {...props} />,
    li: ({node, ...props}) => (
      <li className="flex items-center gap-6 bg-white/5 p-6 rounded-2xl border border-white/5 print:border-black/10 print:bg-gray-50">
        <div className="w-3 h-3 rounded-sm bg-[#D4A853] shrink-0" />
        <span className="text-zinc-100 text-xl font-medium print:text-black">{props.children}</span>
      </li>
    ),
    hr: ({node, ...props}) => <hr className="my-24 border-t-2 border-white/10 print:border-black/10 print:page-break-after-always" {...props} />,
    img: ({node, ...props}) => (
      <div className="my-16 rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white/10 print:ring-black/10">
        <img className="w-full h-auto object-cover" {...props} alt={props.alt} />
      </div>
    )
  };

  // --- DESIGN SYSTEM: ONE-PAGER (Compacto, Ejecutivo, Datos) ---
  const onePagerComponents: Components = {
    h1: ({node, ...props}) => <h1 className="text-3xl uppercase tracking-widest text-white mb-6 font-sans font-bold border-b-2 border-[#D4A853] pb-2 print:text-black" {...props} />,
    h2: ({node, ...props}) => <h2 className="text-xl uppercase tracking-wider text-[#D4A853] mt-8 mb-3 font-sans font-bold print:text-black" {...props} />,
    h3: ({node, ...props}) => <h3 className="text-sm tracking-widest text-zinc-400 mt-6 mb-2 font-sans font-bold uppercase print:text-gray-500" {...props} />,
    p: ({node, ...props}) => <p className="text-zinc-300 leading-snug font-normal mb-4 text-sm print:text-black" {...props} />,
    ul: ({node, ...props}) => <ul className="space-y-1.5 my-4 list-disc pl-5 text-[#D4A853]" {...props} />,
    li: ({node, ...props}) => <li className="text-zinc-300 text-sm print:text-black"><span className="text-zinc-300 print:text-black">{props.children}</span></li>,
    table: ({node, ...props}) => (
      <div className="overflow-x-auto my-6 border-y border-white/20 print:border-black/20">
        <table className="w-full text-left text-sm" {...props} />
      </div>
    ),
    th: ({node, ...props}) => <th className="py-2 pr-4 border-b border-white/20 font-bold text-white uppercase print:text-black print:border-black/20" {...props} />,
    td: ({node, ...props}) => <td className="py-2 pr-4 border-b border-white/10 text-zinc-300 print:text-black print:border-black/10" {...props} />,
  };

  const currentComponents = docType === 'dossier' ? dossierComponents : docType === 'deck' ? deckComponents : onePagerComponents;

  return (
    <div className={`min-h-screen ${docType === 'deck' ? 'bg-black' : 'bg-[#070707]'} text-white font-sans selection:bg-[#D4A853] selection:text-black print:bg-white print:text-black`}>
      {/* Navbar for screen only (Hidden in print) */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4 flex items-center justify-between border-b border-white/5 bg-[#070707]/90 backdrop-blur-md print:hidden">
        <Link href={`/resources/${slug}`} className="text-zinc-400 hover:text-white flex items-center gap-2 transition-colors">
          <ArrowLeftIcon className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Hub</span>
        </Link>
        <div className="text-[#D4A853] font-serif text-sm md:text-xl tracking-widest">{project.title.toUpperCase()}</div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex bg-white/5 rounded-full p-1 border border-white/10">
            <Link href={`?lang=es`} className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${lang === 'es' ? 'bg-[#D4A853] text-black' : 'text-white hover:text-[#D4A853]'}`}>ES</Link>
            <Link href={`?lang=en`} className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${lang === 'en' ? 'bg-[#D4A853] text-black' : 'text-white hover:text-[#D4A853]'}`}>EN</Link>
          </div>
          <PrintButton />
        </div>
      </nav>

      {/* Main Document Body */}
      <main className={`pt-32 pb-24 mx-auto print:pt-0 print:pb-0 print:px-0 print:max-w-none ${docType === 'one-pager' ? 'px-6 max-w-3xl' : 'px-6 sm:px-12 md:px-24 max-w-5xl'}`}>
        
        {/* Document Cover Section */}
        <div className={`mb-16 pb-16 border-b border-white/10 print:h-[95vh] print:flex print:flex-col print:justify-center print:border-none print:mb-0 print:pb-0 print:page-break-after-always ${docType === 'deck' ? 'text-center items-center flex flex-col' : ''}`}>
          <div className={`w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-8 print:bg-gray-100 print:border-black/10 ${docType === 'deck' ? 'w-24 h-24 rounded-3xl mb-12' : ''}`}>
            <div className="text-3xl text-[#D4A853] font-serif font-bold">{project.title.charAt(0)}</div>
          </div>
          
          <div className="text-[#D4A853] text-xs sm:text-sm uppercase tracking-[0.3em] mb-4 font-bold print:text-black">
            {project.title} — {docType === 'one-pager' ? 'Executive Summary' : docType === 'deck' ? 'Investor Presentation' : 'Private Dossier'}
          </div>
          
          <h1 className={`font-serif uppercase text-white leading-none mb-8 print:text-black ${docType === 'one-pager' ? 'text-4xl sm:text-5xl' : docType === 'deck' ? 'text-6xl sm:text-8xl md:text-9xl font-black font-sans tracking-tighter' : 'text-5xl sm:text-7xl md:text-8xl'}`}>
            {docType === 'one-pager' ? 'One Pager' : docType === 'deck' ? 'Pitch Deck' : 'Dossier'}
          </h1>
          
          <div className={`h-1 bg-gradient-to-r from-[#D4A853] to-transparent mb-8 print:bg-[#D4A853] ${docType === 'deck' ? 'w-full max-w-md from-transparent via-[#D4A853] to-transparent' : 'w-32'}`} />
          
          <p className={`text-lg text-zinc-400 font-light leading-relaxed print:text-gray-600 ${docType === 'one-pager' ? 'max-w-lg text-base' : 'max-w-2xl'}`}>
            {lang === 'es' ? 'Documento confidencial preparado para revisión de interesados y stakeholders.' : 'Confidential document prepared for stakeholders review.'} 
            <br/><br/>
            <span className="text-xs tracking-widest uppercase text-white/30 print:text-black/40">
              © {new Date().getFullYear()} {project.title}. Todos los derechos reservados.
            </span>
          </p>
        </div>

        <article className={`max-w-none print:pt-12 ${docType === 'one-pager' ? 'columns-1 md:columns-2 gap-12' : ''}`}>
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              body {
                background-color: #ffffff !important;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
              @page {
                margin: 20mm;
              }
              h1, h2, h3 {
                page-break-after: avoid;
              }
              img {
                page-break-inside: avoid;
              }
              table {
                page-break-inside: auto;
              }
              tr {
                page-break-inside: avoid;
                page-break-after: auto;
              }
              .page-break-after-always {
                page-break-after: always;
              }
              ${docType === 'one-pager' ? `
                .columns-1 {
                  column-count: 2 !important;
                  column-gap: 30px !important;
                }
              ` : ''}
            }
          `}} />
          
          <ReactMarkdown components={currentComponents}>{markdownContent}</ReactMarkdown>
        </article>
      </main>
    </div>
  );
}
