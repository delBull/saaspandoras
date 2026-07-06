import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import PrintButton from './PrintButton';

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

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-[#D4A853] selection:text-black">
      {/* Navbar for screen only (Hidden in print) */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4 flex items-center justify-between border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-md print:hidden">
        <Link href={`/resources/${slug}`} className="text-zinc-400 hover:text-white flex items-center gap-2 transition-colors">
          <ArrowLeftIcon className="w-4 h-4" />
          <span className="text-sm font-medium uppercase tracking-widest">Volver al Hub</span>
        </Link>
        <div className="text-[#D4A853] font-serif text-xl tracking-widest">{project.title.toUpperCase()}</div>
        <div className="flex items-center gap-4">
          <div className="flex bg-white/5 rounded-full p-1 border border-white/10">
            <Link href={`?lang=es`} className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${lang === 'es' ? 'bg-[#D4A853] text-black' : 'text-white hover:text-[#D4A853]'}`}>ES</Link>
            <Link href={`?lang=en`} className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${lang === 'en' ? 'bg-[#D4A853] text-black' : 'text-white hover:text-[#D4A853]'}`}>EN</Link>
          </div>
          <PrintButton />
        </div>
      </nav>

      {/* Main Document Body */}
      <main className="pt-32 pb-24 px-6 sm:px-12 md:px-24 max-w-4xl mx-auto print:pt-0 print:pb-0 print:px-0">
        <article className="prose prose-invert prose-lg max-w-none 
          prose-headings:font-serif prose-headings:font-normal prose-headings:tracking-wider prose-headings:text-[#D4A853]
          prose-h1:text-5xl prose-h1:mb-8 prose-h1:uppercase
          prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-6 prose-h2:uppercase prose-h2:tracking-widest
          prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4 prose-h3:uppercase prose-h3:text-white
          prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:font-light
          prose-strong:text-white prose-strong:font-medium
          prose-ul:text-zinc-300 prose-li:my-1
          prose-a:text-[#D4A853] hover:prose-a:text-yellow-400
          
          print:prose-p:text-black print:prose-strong:text-black print:prose-h1:text-black print:prose-h2:text-black print:prose-h3:text-black
          print:prose-ul:text-black
        ">
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              body {
                background-color: #000000 !important;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
              .prose {
                max-width: 100% !important;
              }
              @page {
                margin: 20mm;
              }
            }
          `}} />
          
          <ReactMarkdown>{markdownContent}</ReactMarkdown>
        </article>
      </main>
    </div>
  );
}
