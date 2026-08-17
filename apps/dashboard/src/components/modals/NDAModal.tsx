import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield } from 'lucide-react';
import { Button } from '@saasfly/ui/button';

interface NDAModalProps {
  isOpen: boolean;
  onClose: () => void;
  version: string;
}

export function NDAModal({ isOpen, onClose, version }: NDAModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 z-[101] h-[85vh] bg-zinc-950 border-t border-zinc-800 rounded-t-2xl sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-3xl sm:h-[80vh] sm:rounded-2xl sm:border flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/60 bg-zinc-900/40">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Shield className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white tracking-tight">Acuerdo Maestro de Confidencialidad</h2>
                  <p className="text-[11px] text-zinc-500 font-mono tracking-wider uppercase">Versión {version}</p>
                </div>
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
                  <strong>ACUERDO MAESTRO DE CONFIDENCIALIDAD, NO USO, NO CIRCUNVENCIÓN Y PROTECCIÓN DE INFORMACIÓN</strong>
                </p>
                
                <div className="grid grid-cols-2 gap-4 my-6 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800/50 text-xs">
                  <div>
                    <span className="block text-zinc-500 mb-1">Modalidad</span>
                    <strong className="text-zinc-300">Aceptación electrónica / Deal Room</strong>
                  </div>
                  <div>
                    <span className="block text-zinc-500 mb-1">Naturaleza</span>
                    <strong className="text-zinc-300">Acuerdo unilateral</strong>
                  </div>
                </div>

                <h3>1. Objeto</h3>
                <p>El presente Acuerdo establece las obligaciones aplicables al Receptor respecto de toda información que Pandora's Group Holdings, sus entidades relacionadas, colaboradores autorizados, socios, proyectos, clientes o representantes proporcionen al Receptor con motivo de una posible relación comercial, inversión, colaboración, prestación de servicios, asociación estratégica, desarrollo tecnológico, evaluación de oportunidades, due diligence o cualquier otra oportunidad de negocio.</p>
                <p>El acceso al Deal Room, la consulta de documentación, la descarga de materiales, la utilización de información proporcionada o la aceptación electrónica del presente Acuerdo constituirá aceptación expresa de sus términos.</p>
                <p>El presente Acuerdo podrá aplicarse independientemente de que posteriormente se celebre o no un contrato comercial definitivo entre las partes.</p>

                <h3>2. Definiciones</h3>
                <h4>2.1 Pandora's</h4>
                <p>Para efectos de este Acuerdo, "Pandora's" comprende Pandora's Group Holdings y cualquier sociedad, subsidiaria, afiliada, vehículo, marca, producto, plataforma, proyecto, unidad de negocio o entidad relacionada que actualmente exista o que posteriormente sea creada o incorporada al ecosistema empresarial de Pandora's. La protección se extiende a la información perteneciente a cualquiera de dichas entidades.</p>

                <h4>2.2 Información Confidencial</h4>
                <p>Se considera Información Confidencial toda información no pública revelada directa o indirectamente al Receptor, independientemente de su formato, soporte, medio de transmisión o forma de identificación. La Información Confidencial comprende, entre otras:</p>
                
                <h5>a) Información corporativa y estratégica</h5>
                <ul>
                  <li>estructuras corporativas; estrategias empresariales; planes de expansión; modelos de negocio;</li>
                  <li>roadmaps; planes de lanzamiento; estrategias de mercado; estrategias de crecimiento;</li>
                  <li>oportunidades de negocio; negociaciones; alianzas; proveedores; socios; clientes; prospectos; inversionistas;</li>
                  <li>estructuras comerciales; pricing; métricas; información financiera no pública.</li>
                </ul>

                <h5>b) Información tecnológica</h5>
                <ul>
                  <li>código fuente; código objeto; repositorios; arquitectura de software y sistemas; APIs; endpoints;</li>
                  <li>bases de datos; modelos de datos; esquemas; infraestructura; configuraciones; pipelines;</li>
                  <li>sistemas de autenticación y autorización; mecanismos de seguridad; documentación técnica; algoritmos;</li>
                  <li>lógica de negocio; procesos internos; metodologías; know-how técnico.</li>
                </ul>

                <h5>c) Inteligencia Artificial y sistemas cognitivos</h5>
                <ul>
                  <li>Hermes; Hermes Runtime; Hermes OS; Growth OS; agentes; subagentes;</li>
                  <li>prompts; system prompts; domain packs; knowledge packs; estrategias; workflows; journeys;</li>
                  <li>motores de decisión; sistemas de memoria y conocimiento; RAG; políticas; reglas de gobernanza cognitiva;</li>
                  <li>arquitecturas de agentes; herramientas; tool registries; modelos de contexto; metodologías;</li>
                  <li>cualquier producto, módulo o componente relacionado con inteligencia artificial.</li>
                </ul>

                <h5>d) Propiedad intelectual y productos</h5>
                <ul>
                  <li>productos actuales y futuros; funcionalidades; prototipos; diseños; conceptos; interfaces; UX/UI;</li>
                  <li>documentación; marcas; nombres comerciales; metodologías; procesos; diseños de arquitectura;</li>
                  <li>conceptos aún no publicados.</li>
                </ul>

                <h5>e) Blockchain y Web3</h5>
                <ul>
                  <li>smart contracts y su código; direcciones y relaciones entre contratos no públicas; arquitecturas blockchain;</li>
                  <li>estructuras de emisión; mecanismos de participación; modelos de tokenización; NFT utilities; mecanismos de gobernanza;</li>
                  <li>wallets operativas; infraestructura; procesos de deployment; configuraciones; mecanismos off-chain;</li>
                  <li>mecanismos de interoperabilidad; estrategias blockchain; modelos económicos; documentación de activos digitales.</li>
                </ul>

                <h5>f) Proyectos y clientes</h5>
                <p>La información relativa a proyectos, clientes, protocolos, estructuras de inversión, participaciones, activos, vehículos jurídicos, modelos económicos, operaciones, contratos o productos desarrollados o gestionados por Pandora's. Esto incluye expresamente información relacionada con <strong>S'Narai</strong> y cualquier otro proyecto presente o futuro.</p>

                <h5>g) Pandora's Media Co</h5>
                <ul>
                  <li>estrategias de marketing; campañas; creatividad; contenido; audiencias; métricas; analítica;</li>
                  <li>automatizaciones; infraestructura de marketing; procesos; agentes; sistemas de distribución; estrategias de adquisición.</li>
                </ul>

                <h5>h) Deal Rooms</h5>
                <p>Toda información contenida en el Deal Room, incluyendo documentos, archivos, conversaciones, presentaciones, datasets, contratos, análisis, anexos, materiales técnicos, información financiera, información de terceros y cualquier otra información accesible mediante el mismo.</p>

                <h3>3. Información derivada</h3>
                <p>La Información Confidencial comprende también cualquier análisis, resumen, evaluación, modelo, documento, diseño, conclusión, estrategia, arquitectura, propuesta o material elaborado por el Receptor que:</p>
                <ol>
                  <li>incorpore Información Confidencial;</li>
                  <li>derive de Información Confidencial; o</li>
                  <li>permita reconstruir razonablemente elementos sustanciales de Información Confidencial.</li>
                </ol>
                <p>El hecho de que dicha información haya sido modificada, resumida, traducida, reorganizada o combinada con información propia del Receptor no elimina su carácter confidencial.</p>

                <h3>4. Obligación de confidencialidad</h3>
                <p>El Receptor deberá mantener estrictamente confidencial toda Información Confidencial y deberá protegerla con un grado de cuidado no inferior al utilizado para proteger su propia información confidencial de mayor importancia.</p>
                <p>El Receptor no podrá divulgar, publicar, distribuir, reproducir, transmitir, vender, licenciar, transferir ni poner a disposición de terceros Información Confidencial sin autorización previa y expresa de Pandora's.</p>

                <h3>5. Uso limitado</h3>
                <p>El Receptor utilizará la Información Confidencial exclusivamente para: evaluar la oportunidad de negocio; participar en conversaciones con Pandora's; realizar due diligence autorizada; ejecutar una relación comercial autorizada; o cualquier finalidad expresamente autorizada por Pandora's.</p>
                <p>Queda prohibido utilizar la Información Confidencial para cualquier finalidad personal, comercial, competitiva, tecnológica, financiera o estratégica distinta de la autorizada.</p>

                <h3>6. Prohibición de explotación competitiva</h3>
                <p>El Receptor no podrá utilizar Información Confidencial para: desarrollar productos competidores; desarrollar servicios equivalentes; replicar modelos de negocio o arquitecturas; crear productos derivados; financiar proyectos competidores; asesorar a competidores; transferir conocimiento a competidores; o facilitar la creación de productos que sustituyan o compitan con productos de Pandora's.</p>
                <p>Esta obligación se limita al uso de Información Confidencial y no constituye una prohibición general para que el Receptor participe en industrias lícitas utilizando conocimientos generales obtenidos independientemente.</p>

                <h3>7. No ingeniería inversa y no extracción de know-how</h3>
                <p>El Receptor no podrá utilizar la Información Confidencial para reconstruir, replicar, clonar o reproducir: software; arquitectura; protocolos; sistemas; agentes; workflows; modelos; metodologías; smart contracts; mecanismos de negocio; procesos; estructuras tecnológicas; sistemas de IA; productos o funcionalidades. Asimismo, no podrá utilizar la información para desarrollar una solución sustancialmente equivalente mediante ingeniería inversa, abstracción, descomposición o reconstrucción conceptual.</p>

                <h3>8. No circunvención</h3>
                <p>El Receptor no podrá utilizar Información Confidencial para eludir, desplazar o circunvenir a Pandora's respecto de: clientes; inversionistas; socios; proveedores; desarrolladores; operadores; proyectos; oportunidades; activos; vehículos; o relaciones comerciales que haya conocido exclusivamente como consecuencia de su relación con Pandora's.</p>

                <h3>9. Acceso bajo necesidad de conocer</h3>
                <p>El Receptor únicamente podrá compartir Información Confidencial con sus empleados, asesores o colaboradores que necesiten conocerla para la finalidad autorizada, estén sujetos a obligaciones de confidencialidad apropiadas y hayan sido informados del carácter confidencial. El Receptor será responsable por cualquier incumplimiento de estas personas.</p>

                <h3>10. Seguridad</h3>
                <p>El Receptor deberá adoptar medidas razonables y apropiadas para impedir acceso no autorizado, pérdida, robo, copia no autorizada, extracción, publicación, transferencia, filtración, modificación o destrucción de la Información Confidencial, y notificará inmediatamente a Pandora's cualquier incidente.</p>

                <h3>11. Credenciales y secretos técnicos</h3>
                <p>Las credenciales, API keys, tokens, claves, secretos, configuraciones privadas, wallets operativas, accesos administrativos y mecanismos de autenticación proporcionados tendrán carácter estrictamente confidencial. El Receptor no podrá compartirlos, publicarlos, almacenarlos de manera insegura, incorporarlos a repositorios públicos ni utilizarlos fuera del propósito autorizado.</p>

                <h3>12. Blockchain y registros públicos</h3>
                <p>El hecho de que determinada información pueda observarse públicamente en una blockchain no implica que toda la información relacionada deje de ser confidencial. Esto incluye conocimiento no público relativo a arquitectura, propósito, estrategia, integración, configuración, operación, gobernanza, procesos, mecanismos off-chain, modelos económicos y metodología de utilización.</p>

                <h3>13. Exclusiones</h3>
                <p>No será considerada Información Confidencial aquella que el Receptor pueda demostrar documentalmente que: era legítimamente pública antes de ser revelada; se volvió pública sin incumplimiento de este Acuerdo; ya se encontraba legítimamente en posesión del Receptor sin obligación de confidencialidad; fue desarrollada independientemente; o fue recibida legítimamente de un tercero con derecho a revelarla.</p>

                <h3>14. Revelación obligatoria por ley</h3>
                <p>Si una autoridad competente exige revelar Información Confidencial, el Receptor deberá, cuando legalmente sea posible, notificar inmediatamente a Pandora's, cooperar razonablemente para obtener medidas de protección y revelar únicamente la información estrictamente requerida.</p>

                <h3>15 a 17. Propiedad intelectual y ausencia de licencia</h3>
                <p>Toda Información Confidencial continuará siendo propiedad exclusiva de Pandora's. El acceso al Deal Room no constituye cesión, licencia, autorización de explotación ni transferencia de propiedad intelectual. Ninguna disposición otorgará licencia sobre software, marcas, patentes, smart contracts, algoritmos, metodologías, secretos comerciales o know-how. El acceso tampoco autoriza al Receptor a representar a Pandora's.</p>

                <h3>18. Devolución y destrucción</h3>
                <p>A solicitud de Pandora's, o cuando termine la relación, el Receptor deberá devolver o destruir la Información Confidencial bajo su control, incluyendo copias digitales y materiales derivados.</p>

                <h3>19. Duración y supervivencia</h3>
                <p>El presente Acuerdo entrará en vigor desde su aceptación electrónica. <strong>Las obligaciones de confidencialidad, no uso y protección de secretos comerciales no estarán limitadas a un plazo fijo.</strong> Permanecerán vigentes mientras la Información Confidencial conserve su carácter confidencial o de secreto comercial conforme a la legislación aplicable.</p>

                <h3>20 a 31. Disposiciones Generales</h3>
                <p>El Receptor reconoce que el incumplimiento puede causar daños económicos y estratégicos. La Información Confidencial puede incluir datos de terceros o datos personales, los cuales deben ser tratados conforme a la ley aplicable. Este Acuerdo no crea sociedades o relaciones laborales, ni obliga a celebrar negocios. La información se proporciona "AS IS". El Receptor no podrá ceder sus obligaciones sin autorización.</p>

                <h3>32 y 33. Legislación aplicable y jurisdicción</h3>
                <p>Este Acuerdo se regirá conforme a las leyes de los <strong>Estados Unidos Mexicanos</strong>. Las partes se someterán a los tribunales competentes conforme a la legislación mexicana y al domicilio que Pandora's determine legalmente aplicable, sin perjuicio del derecho de solicitar medidas cautelares ante cualquier autoridad.</p>

                <h3>34. Reconocimiento final y Aceptación Electrónica</h3>
                <p>Al aceptar este Acuerdo, el Receptor reconoce que la información proporcionada tiene un valor comercial significativo y no podrá utilizarse fuera de la finalidad autorizada. La selección de "Aceptar", firma electrónica, aceptación mediante wallet o cualquier mecanismo de consentimiento implementado en el Deal Room constituye aceptación expresa del Acuerdo en su versión vigente.</p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-zinc-800/60 bg-zinc-900/40 flex justify-end">
              <Button onClick={onClose} variant="secondary">
                Cerrar documento
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
