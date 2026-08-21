import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

interface NDAModalProps {
  isOpen: boolean;
  onClose: () => void;
  version?: string;
}

export function NDAModal({ isOpen, onClose, version = "v2.1" }: NDAModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[9999] w-screen h-screen md:w-full md:h-[85vh] md:max-w-4xl md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 bg-[#0C0C10] border-0 md:border md:border-zinc-800/60 rounded-none md:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/60 bg-zinc-900/40 shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">
                  Pandora's Ecosystem Master NDA
                </h2>
                <p className="text-sm text-zinc-500 font-mono mt-0.5">
                  Versión: {version}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-8 md:px-10 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              <div className="prose prose-invert prose-sm max-w-none text-zinc-400 marker:text-zinc-600 prose-headings:text-zinc-200 prose-headings:font-medium prose-strong:text-zinc-300">
                <p className="lead text-zinc-300">
                  <strong>PANDORA'S MASTER CONFIDENTIALITY, NON-USE, NON-CIRCUMVENTION & INTELLECTUAL PROPERTY PROTECTION AGREEMENT</strong>
                </p>
                
                <div className="grid grid-cols-2 gap-4 my-6 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800/50 text-xs">
                  <div>
                    <span className="block text-zinc-500 mb-1">Modalidad</span>
                    <strong className="text-zinc-300">Aceptación electrónica / Deal Room</strong>
                  </div>
                  <div>
                    <span className="block text-zinc-500 mb-1">Naturaleza</span>
                    <strong className="text-zinc-300">Acuerdo unilateral maestro de protección</strong>
                  </div>
                </div>

                <h3>1. Objeto y Arquitectura Contractual</h3>
                <p>El presente Acuerdo Maestro establece las obligaciones aplicables al Receptor respecto de toda información que Pandora's Group Holdings, sus entidades relacionadas, colaboradores autorizados, socios, proyectos, clientes o representantes (en adelante, el "Emisor" o "Pandora's") proporcionen al Receptor. Este Acuerdo es el instrumento estándar y global de Pandora's utilizado para proteger su ecosistema, arquitectura, tecnología, modelos operativos y Deal Room.</p>
                <p><strong>El acceso al ecosistema Pandora's es un privilegio condicionado, y el acceso a información confidencial de Pandora's no otorga ningún derecho sobre ella.</strong> La relación entre las partes se rige por la siguiente jerarquía documental explícita:</p>
                <ol>
                  <li><strong>NDA Maestro:</strong> Protección general del ecosistema Pandora's (el presente Acuerdo).</li>
                  <li><strong>Project / Deal Agreement:</strong> Relación concreta sobre un proyecto en particular.</li>
                  <li><strong>Investment / Participation / Service / License Agreement:</strong> Derechos y obligaciones específicos, comerciales o financieros.</li>
                </ol>

                <h3>2. No reciprocidad automática e Información de Terceros</h3>
                <p>El hecho de que el Receptor proporcione información propia a Pandora's (por ejemplo, en calidad de Applicant de un proyecto) no convierte automáticamente el presente Acuerdo en un acuerdo bilateral de confidencialidad, ni genera derechos recíprocos sobre la Información Confidencial de Pandora's.</p>
                <p>No obstante, Pandora's reconoce que el Receptor puede proporcionar información corporativa, financiera o técnica de su propio proyecto. Pandora's se compromete a utilizar dicha información exclusivamente para evaluar la integración u oportunidad, aplicar medidas razonables de seguridad, no explotarla comercialmente fuera del marco del proyecto y no divulgarla fuera de las personas con necesidad legítima de conocerla. Esta disposición protege la información del Applicant sin alterar la naturaleza unilateral, finalidad ni estructura de protección del presente NDA Maestro.</p>

                <h3>3. Definiciones</h3>
                <h4>3.1 Pandora's (El Emisor)</h4>
                <p>Comprende Pandora's Group Holdings y cualquier sociedad, subsidiaria, afiliada, vehículo, marca, producto, plataforma, proyecto, unidad de negocio o entidad relacionada que actualmente exista o sea posteriormente creada o incorporada al ecosistema.</p>

                <h4>3.2 Información Confidencial</h4>
                <p>Toda información no pública revelada directa o indirectamente al Receptor que razonablemente deba entenderse como confidencial por su naturaleza o por las circunstancias en que fue revelada, independientemente de que esté expresamente marcada como "Confidencial". Comprende, sin limitación:</p>
                <ul>
                  <li><strong>Información oral, visual y demostrada:</strong> documentos, código, interfaces, demostraciones, presentaciones, reuniones, conversaciones, pantallas, arquitecturas, prototipos, información visual y verbal obtenida mediante acceso al software o llamadas.</li>
                  <li><strong>Información corporativa y estratégica:</strong> modelos de negocio, oportunidades, negociaciones, pricing, métricas, información financiera no pública, planes de expansión.</li>
                  <li><strong>Información tecnológica:</strong> código fuente y objeto, repositorios, arquitectura, APIs, endpoints, bases de datos, lógica de negocio.</li>
                  <li><strong>IA y sistemas cognitivos:</strong> Hermes, Hermes Runtime, Growth OS, agentes, prompts, system prompts, modelos de memoria y conocimiento, RAG, arquitecturas, motores de decisión.</li>
                  <li><strong>Propiedad intelectual:</strong> productos actuales y futuros, funcionalidades, diseños, conceptos, marcas.</li>
                  <li><strong>Proyectos, Media y Deal Rooms:</strong> S'Narai, Pandora's Media Co, estrategias de marketing, información de terceros en el Deal Room.</li>
                </ul>

                <h3>4. Información Derivada y Contaminación</h3>
                <p>Si el Receptor obtiene Información Confidencial de Pandora's y posteriormente la combina, resume, traduce o reorganiza con conocimientos, desarrollos, análisis o información propia, la parte o resultado que derive, incorpore o permita reconstruir sustancialmente dicha Información Confidencial seguirá estando plenamente protegida bajo este Acuerdo. El hecho de desarrollar material propio sobre la base de información de Pandora's no elimina su carácter confidencial.</p>

                <h3>5. Desarrollo Independiente (Independent Development)</h3>
                <p>Lo dispuesto en este Acuerdo no restringe al Receptor de utilizar, desarrollar o comercializar información, productos o tecnologías que el Receptor pueda demostrar documentalmente que: (i) ya conocía legítimamente antes de recibirla de Pandora's; (ii) fueron desarrollados de manera completamente independiente por personal del Receptor sin acceso ni uso, directo o indirecto, de la Información Confidencial de Pandora's; o (iii) se volvieron de dominio público sin mediar incumplimiento del Receptor. Esta exclusión protege el desarrollo legítimo e independiente del Receptor, limitando las restricciones del Acuerdo exclusivamente a la protección de aquello que conoció a través de Pandora's.</p>

                <h3>6. No Reconstrucción, Ingeniería Inversa ni Extracción (No Reconstruction)</h3>
                <p>El Receptor no podrá utilizar la Información Confidencial para realizar ingeniería inversa, descompilar, analizar, replicar, modelar o inferir el código o funcionamiento de los sistemas. Asimismo, el Receptor <strong>no podrá reconstruir, replicar o implementar sustancialmente una arquitectura conceptual, sistema, metodología, modelo operativo o estructura comercial de Pandora's</strong> utilizando Información Confidencial, aunque el resultado final sea desarrollado mediante código, infraestructura o documentación diferente.</p>

                <h3>7. No Circunvención del Modelo de Negocio (No Circumvention)</h3>
                <p>Durante la relación entre las partes y mientras la información conserve su protección, el Receptor no podrá utilizar la Información Confidencial para:</p>
                <ul>
                  <li>Desarrollar o participar en una iniciativa sustancialmente equivalente o competitiva contra Pandora's.</li>
                  <li>Identificar cómo está estructurado el negocio de Pandora's para reproducir posteriormente dicha estructura fuera del ecosistema.</li>
                  <li>Eludir, desplazar, puentear o contactar directamente a Pandora's respecto a clientes, inversionistas, socios, proveedores, desarrolladores, operadores, oportunidades, activos o vehículos cuya identidad o relación haya conocido exclusivamente mediante el acceso a la Información Confidencial o al Deal Room.</li>
                </ul>

                <h3>8. No Solicitación (No Poaching)</h3>
                <p>El Receptor no podrá utilizar información obtenida mediante Pandora's o el Deal Room para inducir a terceros a terminar sus relaciones con Pandora's, ni para contratar, intentar contratar, captar o llevarse a empleados, colaboradores, contractors, partners, clientes, inversionistas o proveedores cuya relación con Pandora's haya sido descubierta o conocida por virtud del presente Acuerdo.</p>

                <h3>9. Prohibición de Entrenamiento de IA y Scraping</h3>
                <p>El Receptor no podrá utilizar Información Confidencial para entrenar, ajustar, evaluar, enriquecer, fine-tunear, desarrollar prompts, datasets, embeddings, modelos o sistemas de inteligencia artificial propios o de terceros. Queda expresamente prohibido introducir Información Confidencial en servicios públicos de IA, modelos de terceros o herramientas SaaS cuyo tratamiento pueda implicar retención o entrenamiento.</p>
                <p>Asimismo, queda estrictamente prohibido realizar scraping, crawling, extracción automatizada, bulk download, enumeración de endpoints o utilizar mecanismos destinados a extraer información fuera del acceso expresamente autorizado.</p>

                <h3>10. Protección de Infraestructura Blockchain y Web3</h3>
                <p>Tendrán carácter estrictamente confidencial y protegido los elementos de la infraestructura Web3 de Pandora's, incluyendo: smart contracts, contract addresses y relaciones no públicas entre contratos, deployment architecture, wallets, multisigs, signing infrastructure, estructuras de tokenización, arquitectura NFT, estructuras de participación, on-chain registries, mecanismos de gobernanza, arquitectura de tesorería, procedimientos de deployment, modelos económicos y la relación entre componentes off-chain y on-chain.</p>

                <h3>11. Protección de Credenciales y Seguridad (No Wallet Access)</h3>
                <p>El acceso mediante wallet, firma criptográfica, API key, credential, token, sesión o mecanismo equivalente <strong>no concede derecho alguno sobre activos, contratos, infraestructura o información de Pandora's</strong> más allá de la autorización específica de lectura o participación. El Receptor no podrá intentar obtener, derivar, reutilizar, transferir o acceder a credenciales, secretos técnicos, claves privadas, wallets operativas o mecanismos de autenticación de Pandora's.</p>

                <h3>12. Propiedad Intelectual y Ausencia de Licencia (No Grant)</h3>
                <p>Toda Información Confidencial continuará siendo propiedad exclusiva de su respectivo titular. <strong>Ninguna revelación de información será interpretada como una licencia implícita, autorización de uso comercial, derecho de explotación, derecho de reproducción, derecho de sublicencia, derecho de fork, derecho de modificación o derecho de creación de obras derivadas.</strong></p>

                <h3>13. No Conocimientos Residuales (No Residuals)</h3>
                <p>El Receptor reconoce y acepta que no obtiene ningún derecho a utilizar conocimientos residuales, recuerdos no documentados o impresiones generales derivadas de su exposición a la Información Confidencial para desarrollar, optimizar, estructurar o diseñar productos, servicios, arquitecturas o modelos competitivos o equivalentes en el futuro.</p>

                <h3>14. Uso Autorizado y Acceso Limitado</h3>
                <p>El Receptor utilizará la Información Confidencial exclusivamente para evaluar, analizar, negociar, estructurar o ejecutar la oportunidad de negocio para la cual fue autorizado a acceder al Deal Room. Podrá proporcionar acceso estrictamente limitado a sus abogados o asesores profesionales directos, siempre que tengan necesidad legítima de conocer, estén sujetos a confidencialidad equivalente, y el Receptor asuma plena responsabilidad por cualquier incumplimiento de estos terceros.</p>

                <h3>15. Seguridad y Obligación de Notificación</h3>
                <p>El Receptor deberá adoptar medidas razonables para proteger la Información Confidencial. Cualquier acceso no autorizado, pérdida, filtración o sospecha de compromiso deberá ser comunicado al Emisor sin demora indebida. <strong>Si el Receptor detecta que cualquier tercero está utilizando o intentando obtener ilícitamente Información Confidencial de Pandora's, deberá notificarlo de inmediato.</strong></p>

                <h3>16. Devolución, Eliminación y Conservación Limitada</h3>
                <p>A solicitud de Pandora's o al finalizar la relación, el Receptor cesará inmediatamente el uso de la Información Confidencial y procederá a su devolución o eliminación (incluyendo copias físicas, digitales y materiales derivados), sin perjuicio de las copias que deban conservarse por estricta obligación legal o regulatoria, las cuales permanecerán sujetas a este Acuerdo.</p>

                <h3>17. Duración y Supervivencia</h3>
                <p>Las obligaciones aquí establecidas continuarán vigentes mientras la Información Confidencial conserve dicho carácter. En particular, <strong>los secretos comerciales, know-how, código, arquitectura, metodologías, estrategias, información técnica y financiera no pública no estarán sujetos a una fecha de expiración automática</strong> y su protección sobrevivirá indefinidamente. Para la Información Confidencial que no constituya secreto comercial, la protección perdurará mientras permanezca razonablemente protegida por el Emisor. La terminación de la relación comercial o el cierre del Deal Room no liberará al Receptor de estas obligaciones.</p>

                <h3>18. Medidas Cautelares (Injunctive Relief) y Soluciones</h3>
                <p>El Receptor reconoce que el incumplimiento de este Acuerdo puede causar daños económicos, estratégicos y operativos irreparables a Pandora's, para los cuales una compensación económica resultaría insuficiente. Por tanto, el Receptor acepta que Pandora's tendrá pleno derecho a solicitar y obtener de manera inmediata medidas cautelares, órdenes de restricción, injunctive relief y cumplimiento forzoso (specific performance) ante cualquier tribunal o autoridad competente, sin necesidad de prestar fianza, de forma adicional a cualquier otro remedio o compensación aplicable en derecho.</p>

                <h3>19. Ausencia de Asociación o Compromiso (No Partnership / No Agency)</h3>
                <p>El acceso al Deal Room y la aceptación del presente Acuerdo no crean ni constituyen de ninguna manera una sociedad (partnership), empresa conjunta (joint venture), agencia, representación, relación laboral, relación fiduciaria, ni una inversión. Asimismo, no generan obligación alguna para Pandora's de contratar, licenciar, financiar, integrar o aceptar el proyecto del Receptor. Pandora's se reserva el derecho de terminar las conversaciones o el acceso al Deal Room en cualquier momento, subsistiendo las obligaciones de confidencialidad del Receptor.</p>

                <h3>20. Disposiciones Generales</h3>
                <p>Este Acuerdo se regirá conforme a las leyes de los <strong>Estados Unidos Mexicanos</strong>. Las partes se someten a los tribunales competentes conforme a la legislación mexicana y al domicilio de Pandora's, sin perjuicio del derecho de solicitar medidas cautelares en cualquier jurisdicción. La información se proporciona "AS IS". El Receptor no podrá ceder sus obligaciones sin autorización previa.</p>

                <h3>21. Reconocimiento final, Evidencia On-Chain y Aceptación Electrónica</h3>
                <p>Al aceptar este Acuerdo, el Receptor reconoce que la información proporcionada tiene un valor comercial y estratégico significativo. La selección de "Aceptar", firma criptográfica mediante wallet, ingreso con token al Deal Room o cualquier mecanismo de consentimiento implementado en la plataforma constituye aceptación expresa, plena e incondicional de este Acuerdo Maestro.</p>
                <p>El Receptor reconoce y consiente que Pandora's registre y conserve de manera inmutable como evidencia electrónica de la aceptación y elemento probatorio de la voluntad expresada por el Receptor, sujeto a la legislación aplicable, los siguientes elementos: <strong>hash criptográfico del documento exacto, versión del documento, timestamp, wallet utilizada, identificador de usuario, correo electrónico, ID del Deal Room y metadata de la sesión cuando legalmente corresponda.</strong> Dicho registro on-chain y/o en base de datos sustenta la voluntad del Receptor y su conformidad con los términos aquí descritos.</p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-zinc-800/60 bg-zinc-900/40 flex items-center justify-between">
              <Button
                onClick={() => window.print()}
                variant="outline"
                className="gap-2 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 text-xs font-mono"
              >
                Descargar / Imprimir NDA (PDF)
              </Button>
              <Button onClick={onClose} variant="secondary">
                Cerrar documento
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted || typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}
