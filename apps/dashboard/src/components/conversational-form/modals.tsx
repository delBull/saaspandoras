"use client";
import { useCallback } from 'react';

export interface InfoModalState {
  isOpen: boolean;
  title: string;
  description: string;
  content: React.ReactNode;
  icon?: string;
}

export function useInfoModals(setInfoModal: (state: InfoModalState) => void) {
  
  const openMechanicModal = useCallback(() => {
    setInfoModal({
      isOpen: true,
      title: '¿Qué es la Mecánica de Utilidad?',
      description: 'Entiende por qué tu protocolo necesita una mecánica clara y cómo definirla correctamente.',
      content: (
        <div className="space-y-4 text-gray-300">
          <div className="bg-lime-500/10 border border-lime-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-lime-400 mb-2">🎯 Definición</h4>
            <p className="text-sm">
              La <strong>mecánica de utilidad</strong> es la regla fundamental que explica cómo tu protocolo genera valor para sus usuarios. Es la respuesta a '¿Qué obtienen los holders de mis Artefactos?'
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-white">🔑 Elementos Esenciales</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-lime-400 mt-1">•</span>
                <span><strong>Acceso Exclusivo:</strong> Puertas de entrada a servicios, comunidades o experiencias premium</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-lime-400 mt-1">•</span>
                <span><strong>Recompensas Tangibles:</strong> Beneficios económicos, descuentos, o ventajas competitivas</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-lime-400 mt-1">•</span>
                <span><strong>Gobernanza:</strong> Poder de decisión en el futuro del protocolo</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-lime-400 mt-1">•</span>
                <span><strong>Utilidad Continua:</strong> Beneficios que se mantienen y crecen con el tiempo</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-blue-400 mb-2">⚠️ Por qué es Crucial</h4>
            <p className="text-sm">
              Sin una mecánica clara, tu protocolo se convierte en un simple 'token de inversión'. Los usuarios necesitan entender exactamente qué valor obtienen al participar.
            </p>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-purple-400 mb-2">💡 Ejemplos de Buenas Mecánicas</h4>
            <ul className="text-sm space-y-1">
              <li>• <strong>Acceso a Comunidad:</strong> 'Holders pueden unirse a nuestro Discord exclusivo con alpha calls'</li>
              <li>• <strong>Recompensas por Labor:</strong> 'Contribuciones a la DAO generan tokens adicionales'</li>
              <li>• <strong>Descuentos:</strong> 'Holders obtienen 50% descuento en productos/servicios'</li>
              <li>• <strong>Gobernanza:</strong> 'Voto en decisiones que afectan el futuro del protocolo'</li>
            </ul>
          </div>
        </div>
      ),
      icon: '⚙️'
    });
  }, []);

  const openBenefitModal = useCallback(() => {
    setInfoModal({
      isOpen: true,
      title: '¿Qué es un Beneficio Tangible?',
      description: 'Aprende a definir beneficios concretos que los usuarios puedan entender y valorar.',
      content: (
        <div className="space-y-4 text-gray-300">
          <div className="bg-lime-500/10 border border-lime-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-lime-400 mb-2">🎯 Beneficio Tangible</h4>
            <p className="text-sm">
              Un <strong>beneficio tangible</strong> es un valor concreto y medible que los holders de tus Artefactos reciben. Debe ser específico, cuantificable y verificable.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-white">✅ Características de un Buen Beneficio</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong>Específico:</strong> '50% descuento' en lugar de 'descuentos'</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong>Cuantificable:</strong> 'Acceso a 10 eventos exclusivos al año'</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong>Verificable:</strong> 'Recompensas calculadas por algoritmo público'</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong>Inmediato:</strong> Beneficios que se obtienen desde el primer día</span>
              </li>
            </ul>
          </div>

          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-red-400 mb-2">❌ Evita Beneficios Vagós</h4>
            <ul className="text-sm space-y-1">
              <li>• 'Valor futuro' - Demasiado abstracto</li>
              <li>• 'Potencial de crecimiento' - No es un beneficio tangible</li>
              <li>• 'Comunidad exclusiva' - ¿Qué significa exactamente?</li>
              <li>• 'Recompensas por participación' - ¿Cuánto y cómo?</li>
            </ul>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-purple-400 mb-2">💡 Ejemplos de Beneficios Tangibles</h4>
            <ul className="text-sm space-y-1">
              <li>• <strong>Económico:</strong> 'Recibe 5% de todas las transacciones del protocolo'</li>
              <li>• <strong>Acceso:</strong> 'Entrada gratuita a 12 eventos premium al año'</li>
              <li>• <strong>Utilidad:</strong> '50% descuento en todos los productos de la plataforma'</li>
              <li>• <strong>Gobernanza:</strong> '1 voto por cada Artefacto en decisiones DAO'</li>
            </ul>
          </div>
        </div>
      ),
      icon: '🎁'
    });
  }, []);

  const openUtilityModal = useCallback(() => {
    setInfoModal({
      isOpen: true,
      title: '¿Qué es la Utilidad Continua?',
      description: 'Descubre cómo mantener el valor de tus Artefactos a largo plazo.',
      content: (
        <div className="space-y-4 text-gray-300">
          <div className="bg-lime-500/10 border border-lime-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-lime-400 mb-2">🔄 Utilidad Continua</h4>
            <p className="text-sm">
              La <strong>utilidad continua</strong> asegura que tus Artefactos mantengan y aumenten su valor con el tiempo. Es el plan para que los beneficios no desaparezcan después del lanzamiento.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-white">🚀 Estrategias para Utilidad Continua</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">📈</span>
                <span><strong>Actualizaciones del Protocolo:</strong> Nuevas funcionalidades que agregan valor</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">🎯</span>
                <span><strong>Casos de Uso Expandidos:</strong> Nuevos escenarios donde los Artefactos son útiles</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">⏰</span>
                <span><strong>Beneficios por Tenencia:</strong> Ventajas adicionales por mantener los Artefactos largo tiempo</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">🤝</span>
                <span><strong>Integraciones:</strong> Conectar con otras plataformas y servicios</span>
              </li>
            </ul>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-400 mb-2">⚠️ Riesgo de Utilidad Temporal</h4>
            <p className="text-sm">
              Muchos protocolos fracasan porque ofrecen beneficios solo durante el lanzamiento. Sin un plan de utilidad continua, los usuarios pierden interés y el valor de los Artefactos cae.
            </p>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-purple-400 mb-2">💡 Ejemplos de Utilidad Continua</h4>
            <ul className="text-sm space-y-1">
              <li>• <strong>Evolución:</strong> 'Cada 6 meses agregamos nuevas funcionalidades votadas por la comunidad'</li>
              <li>• <strong>Expansión:</strong> 'Integramos con 3 nuevas plataformas cada trimestre'</li>
              <li>• <strong>Recompensas Crecientes:</strong> 'Las recompensas aumentan 10% cada año'</li>
              <li>• <strong>Exclusividad:</strong> 'Holders veteranos obtienen acceso a funciones beta primero'</li>
            </ul>
          </div>
        </div>
      ),
      icon: '🔄'
    });
  }, []);

  const openWorkToEarnModal = useCallback(() => {
    setInfoModal({
      isOpen: true,
      title: '¿Qué es Work-to-Earn?',
      description: 'Entiende el modelo Work-to-Earn y cómo implementarlo correctamente en tu protocolo.',
      content: (
        <div className="space-y-4 text-gray-300">
          <div className="bg-lime-500/10 border border-lime-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-lime-400 mb-2">💼 Work-to-Earn (W2E)</h4>
            <p className="text-sm">
              <strong>Work-to-Earn</strong> es un modelo económico donde los participantes reciben recompensas por contribuir activamente al protocolo. Es 'labor' que genera 'ganancias'.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-white">🎯 Cómo Funciona W2E</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-orange-400 mt-1">1.</span>
                <span><strong>Definir Acciones:</strong> ¿Qué actividades generan recompensas?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-400 mt-1">2.</span>
                <span><strong>Establecer Valor:</strong> ¿Cuánto vale cada contribución?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-400 mt-1">3.</span>
                <span><strong>Medir Contribución:</strong> ¿Cómo se verifica y cuantifica el trabajo?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-400 mt-1">4.</span>
                <span><strong>Distribuir Recompensas:</strong> ¿Cuándo y cómo se pagan?</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-blue-400 mb-2">📋 Ejemplos de Acciones W2E</h4>
            <ul className="text-sm space-y-1">
              <li>• <strong>Contribución DAO:</strong> Propuestas, votación, moderación</li>
              <li>• <strong>Creación de Contenido:</strong> Artículos, videos, tutoriales</li>
              <li>• <strong>Desarrollo:</strong> Código, auditorías, mejoras técnicas</li>
              <li>• <strong>Comunidad:</strong> Reclutamiento, soporte, traducción</li>
              <li>• <strong>Marketing:</strong> Compartir en redes, referidos verificados</li>
            </ul>
          </div>

          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-green-400 mb-2">✅ Mejores Prácticas W2E</h4>
            <ul className="text-sm space-y-1">
              <li>• <strong>Transparencia:</strong> Algoritmos públicos y verificables</li>
              <li>• <strong>Sostenibilidad:</strong> Recompensas que no diluyan excesivamente</li>
              <li>• <strong>Equidad:</strong> Oportunidades para todos los niveles de contribución</li>
              <li>• <strong>Retroalimentación:</strong> Sistema de evaluación comunitario</li>
            </ul>
          </div>

          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-red-400 mb-2">⚠️ Errores Comunes</h4>
            <ul className="text-sm space-y-1">
              <li>• Recompensas infladas que generan desconfianza</li>
              <li>• Sistema demasiado complejo para participar</li>
              <li>• Falta de verificación real de contribuciones</li>
              <li>• Dependencia excesiva de contribuciones voluntarias</li>
            </ul>
          </div>
        </div>
      ),
      icon: '💼'
    });
  }, []);

  const openLegalModal = useCallback(() => {
    setInfoModal({
      isOpen: true,
      title: '¿Por qué es importante tener una entidad legal?',
      description: 'Entiende la importancia de formalizar tu proyecto legalmente.',
      content: (
        <div className="space-y-4 text-gray-300">
          <div className="bg-lime-500/10 border border-lime-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-lime-400 mb-2">⚖️ Importancia Legal</h4>
            <p className="text-sm">
              Una <strong>entidad legal formal</strong> es crucial para proteger tu proyecto, sus participantes y establecer credibilidad en el mercado.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-white">🛡️ Beneficios de tener entidad legal</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong>Protección Legal:</strong> Separa tus activos personales de los del proyecto</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong>Confianza:</strong> Demuestra seriedad y compromiso a inversores y comunidad</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong>Impuestos:</strong> Estructura clara para obligaciones fiscales</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong>Contratos:</strong> Capacidad para celebrar acuerdos legales vinculantes</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-blue-400 mb-2">🏢 Tipos de Entidades</h4>
            <ul className="text-sm space-y-1">
              <li>• <strong>LLC (Limited Liability Company):</strong> Protección limitada, flexible</li>
              <li>• <strong>Corporation:</strong> Más formal, atractiva para inversores institucionales</li>
              <li>• <strong>DAO (Decentralized Autonomous Organization):</strong> Modelo Web3 nativo</li>
              <li>• <strong>Foundation:</strong> Para proyectos sin fines de lucro</li>
            </ul>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-400 mb-2">💡 Recomendaciones</h4>
            <ul className="text-sm space-y-1">
              <li>• <strong>Jurisdicción:</strong> Delaware (USA) es popular por su marco legal favorable</li>
              <li>• <strong>Costo:</strong> $500-2,000 para constituir una LLC básica</li>
              <li>• <strong>Tiempo:</strong> 1-4 semanas dependiendo de la jurisdicción</li>
              <li>• <strong>Asesoría:</strong> Consulta con abogados especializados en Web3</li>
            </ul>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-purple-400 mb-2">🤝 Ayuda de Pandora's</h4>
            <p className="text-sm">
              En <strong>Pandora's Finance</strong> podemos ayudarte a formalizar tu entidad legal, conectarte con abogados especializados en Web3 y guiarte en el proceso de constitución. No es obligatorio, pero muy recomendado para proyectos serios.
            </p>
          </div>
        </div>
      ),
      icon: '⚖️'
    });
  }, []);

  const openMonetizationModal = useCallback(() => {
    setInfoModal({
      isOpen: true,
      title: '¿Cómo elegir el modelo de monetización correcto?',
      description: 'Descubre diferentes estrategias para generar ingresos sostenibles.',
      content: (
        <div className="space-y-4 text-gray-300">
          <div className="bg-lime-500/10 border border-lime-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-lime-400 mb-2">💰 Modelos de Monetización</h4>
            <p className="text-sm">
              El <strong>modelo de monetización</strong> define cómo tu protocolo genera ingresos para financiar las recompensas de utilidad y mantener la sostenibilidad a largo plazo.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h4 className="font-semibold text-blue-400 mb-2">💳 Suscripciones con Artefactos</h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>Acceso Premium:</strong> Niveles de membresía con beneficios escalables</li>
                <li>• <strong>Renovación Anual:</strong> Pago recurrente por mantener acceso</li>
                <li>• <strong>Ventajas:</strong> Ingresos predecibles, retención de usuarios</li>
                <li>• <strong>Ejemplo:</strong> Gitcoin, Patreon</li>
              </ul>
            </div>

            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <h4 className="font-semibold text-green-400 mb-2">🔄 Tarifas por Uso del Servicio</h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>Transacciones:</strong> Comisión por cada operación en la plataforma</li>
                <li>• <strong>API Access:</strong> Tarifas por uso de servicios técnicos</li>
                <li>• <strong>Ventajas:</strong> Escalable, alineado con crecimiento</li>
                <li>• <strong>Ejemplo:</strong> Uniswap, OpenSea</li>
              </ul>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
              <h4 className="font-semibold text-purple-400 mb-2">🛒 Venta de Productos/Servicios</h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>NFTs y Coleccionables:</strong> Arte digital, acceso exclusivo</li>
                <li>• <strong>Mercancía:</strong> Productos físicos relacionados con la marca</li>
                <li>• <strong>Servicios:</strong> Consultoría, desarrollo, soporte premium</li>
                <li>• <strong>Ejemplo:</strong> Bored Ape Yacht Club, Adidas</li>
              </ul>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-400 mb-2">🎯 Factores para elegir</h4>
            <ul className="text-sm space-y-1">
              <li>• <strong>Tipo de Utilidad:</strong> ¿Es acceso, gobernanza, o financiero?</li>
              <li>• <strong>Comunidad:</strong> ¿Qué está dispuesto a pagar tu público?</li>
              <li>• <strong>Escalabilidad:</strong> ¿Cómo crece el ingreso con el proyecto?</li>
              <li>• <strong>Sostenibilidad:</strong> ¿Genera valor continuo para holders?</li>
            </ul>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-orange-400 mb-2">⚖️ Combinación de Modelos</h4>
            <p className="text-sm">
              Muchos protocolos exitosos combinan múltiples fuentes de ingreso. Por ejemplo: suscripciones básicas + tarifas premium + ventas de NFTs exclusivos.
            </p>
          </div>
        </div>
      ),
      icon: '💰'
    });
  }, []);

  const openAdoptionModal = useCallback(() => {
    setInfoModal({
      isOpen: true,
      title: 'Estrategias de adopción para tu protocolo',
      description: 'Aprende a diseñar una estrategia efectiva de distribución inicial.',
      content: (
        <div className="space-y-4 text-gray-300">
          <div className="bg-lime-500/10 border border-lime-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-lime-400 mb-2">🎯 Estrategias de Adopción</h4>
            <p className="text-sm">
              La <strong>estrategia de adopción</strong> define cómo y a quién distribuyes inicialmente tus Artefactos, sentando las bases para el crecimiento sostenible de tu comunidad.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h4 className="font-semibold text-blue-400 mb-2">💰 Venta Pública</h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>IDO/IEO:</strong> Oferta inicial en exchange descentralizado</li>
                <li>• <strong>Preventa:</strong> Venta privada a precio reducido</li>
                <li>• <strong>Mercado Secundario:</strong> Trading libre después del lanzamiento</li>
                <li>• <strong>Cuándo usar:</strong> Proyectos con producto validado</li>
              </ul>
            </div>

            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <h4 className="font-semibold text-green-400 mb-2">🏆 Asignación por Mérito (Labor)</h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>Contribuciones:</strong> Recompensar trabajo realizado en el proyecto</li>
                <li>• <strong>Staking de otros tokens:</strong> Holders de protocolos relacionados</li>
                <li>• <strong>Cuándo usar:</strong> Construir comunidad comprometida desde el inicio</li>
                <li>• <strong>Ejemplo:</strong> Airdrops basados en actividad on-chain</li>
              </ul>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
              <h4 className="font-semibold text-purple-400 mb-2">🎟️ Whitelist (Lista Blanca)</h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>Criterios de Elegibilidad:</strong> Actividad en Discord, Twitter, etc.</li>
                <li>• <strong>Raffles:</strong> Sorteos entre participantes activos</li>
                <li>• <strong>Cuándo usar:</strong> Controlar distribución inicial</li>
                <li>• <strong>Ventaja:</strong> Comunidad pre-comprometida</li>
              </ul>
            </div>

            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
              <h4 className="font-semibold text-orange-400 mb-2">🎁 Airdrop Estratégico</h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>Holders de NFTs:</strong> Propietarios de colecciones específicas</li>
                <li>• <strong>Usuarios de dApps:</strong> Personas activas en protocolos similares</li>
                <li>• <strong>Cuándo usar:</strong> Crear awareness masivo rápidamente</li>
                <li>• <strong>Desventaja:</strong> Alto costo, menor compromiso</li>
              </ul>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-400 mb-2">📊 Factores de Éxito</h4>
            <ul className="text-sm space-y-1">
              <li>• <strong>Alineación:</strong> La estrategia debe reflejar los valores del proyecto</li>
              <li>• <strong>Transparencia:</strong> Criterios claros y verificables</li>
              <li>• <strong>Inclusividad:</strong> Oportunidades para diferentes niveles de compromiso</li>
              <li>• <strong>Sostenibilidad:</strong> Plan para crecimiento post-lanzamiento</li>
            </ul>
          </div>
        </div>
      ),
      icon: '🎯'
    });
  }, []);

  const openMonetizationModalDetailed = useCallback(() => {
    setInfoModal({
      isOpen: true,
      title: 'Sostenibilidad Financiera: El Motor de tu Protocolo',
      description: 'Esta sección te ayuda a definir las fuentes de ingresos que mantendrán tu Protocolo en funcionamiento y que serán la base para fondear las recompensas de Artefactos de Labor.',
      content: (
        <div className="space-y-6 text-gray-300">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-red-400 mb-3 text-lg flex items-center gap-2">
              <span className="text-xl">🚨</span> 1. El Error Común: Dependencia del Activo de Creación
            </h4>
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
              <p className="text-sm leading-relaxed font-medium">
                Tu principal fuente de ingresos a largo plazo NO DEBE SER la venta continua del Activo de Creación (NFT).
              </p>
              <p className="text-sm leading-relaxed mt-2">
                La venta del Activo de Creación es para capitalización inicial (setup). El Protocolo necesita generar ingresos operativos recurrentes para pagar consistentemente las recompensas de Artefactos a los holders que realizan Labor.
              </p>
            </div>
          </div>

          <div className="bg-lime-500/10 border border-lime-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-lime-400 mb-3 text-lg">2. Modelos de Ingreso Sostenible</h4>
            <p className="text-sm leading-relaxed mb-4">
              Elige un modelo o una combinación de modelos que garanticen el flujo de caja del Protocolo:
            </p>

            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <h5 className="font-medium text-blue-400 mb-2">💰 A. Tarifas por Uso del Servicio (Transaction Fees)</h5>
                <div className="space-y-2">
                  <p className="text-sm leading-relaxed">
                    <strong>Definición:</strong> El Protocolo cobra una pequeña comisión por el uso de sus herramientas o por las transacciones que facilita (ej. una tarifa del 1% por cada renta de mini-bodega que se verifica a través del Protocolo).
                  </p>
                  <p className="text-sm leading-relaxed text-green-400">
                    <strong>Relevancia:</strong> Ideal para protocolos que facilitan transacciones o interacciones frecuentes.
                  </p>
                </div>
              </div>

              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                <h5 className="font-medium text-green-400 mb-2">🔄 B. Suscripción/Acceso Premium por Utilidad (SaaS Fees)</h5>
                <div className="space-y-2">
                  <p className="text-sm leading-relaxed">
                    <strong>Definición:</strong> El Protocolo ofrece servicios o datos premium a usuarios que no poseen el Activo de Creación, o a holders que quieren acceder a niveles de utilidad superiores al básico.
                  </p>
                  <p className="text-sm leading-relaxed text-green-400">
                    <strong>Relevancia:</strong> Refuerza el valor del software y genera ingresos externos a la propia comunidad de holders.
                  </p>
                </div>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                <h5 className="font-medium text-purple-400 mb-2">🛒 C. Venta de Servicios/Productos Derivados</h5>
                <div className="space-y-2">
                  <p className="text-sm leading-relaxed">
                    <strong>Definición:</strong> El Protocolo genera ingresos por la venta de productos o servicios relacionados que no son el núcleo de la utilidad. (Ej. Venta de datos agregados, mercancía, servicios de consultoría).
                  </p>
                  <p className="text-sm leading-relaxed text-green-400">
                    <strong>Relevancia:</strong> Funciona bien para proyectos con fuerte marca o activos de información valiosos.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-400 mb-3 text-lg">🏦 3. Tesorería: El Fondo para la Labor</h4>
            <div className="space-y-3">
              <p className="text-sm leading-relaxed">
                Todo el ingreso generado por tu Modelo de Monetización debe confluir a la <strong>Tesorería (Bóveda Multi-Sig)</strong>.
              </p>
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-sm leading-relaxed font-medium">
                  El único propósito de la Tesorería es cubrir costos operativos, desarrollar el Protocolo y, crucialmente, fondear el pool de Artefactos para pagar la Labor (Work-to-Earn).
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      icon: '💰'
    });
  }, []);

  const openAdoptionStrategyModal = useCallback(() => {
    setInfoModal({
      isOpen: true,
      title: 'Estrategias de Adopción: El Plan de Lanzamiento',
      description: 'Esta sección define el proceso que usarás para que los primeros miembros de tu comunidad obtengan sus Activos de Creación (Licencias, Herramientas, etc.).',
      content: (
        <div className="space-y-6 text-gray-300">
          <div className="bg-lime-500/10 border border-lime-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-lime-400 mb-3 text-lg">1. Principios Clave de la Distribución</h4>

            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <h5 className="font-medium text-blue-400 mb-2">📅 A. Distribución por Fases (Rondas)</h5>
                <p className="text-sm leading-relaxed">
                  Tu Estrategia de Adopción inicial debe ser vista como la <strong>Fase 1</strong>. Es importante planear la distribución del Supply Total en rondas a lo largo del tiempo. Esto gestiona la demanda y permite que el Protocolo crezca de forma controlada.
                </p>
              </div>

              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                <h5 className="font-medium text-green-400 mb-2">🔍 B. Transparencia</h5>
                <p className="text-sm leading-relaxed">
                  Debes ser claro sobre qué porcentaje de los Activos de Creación se destina a esta fase y qué criterios se usarán para la elegibilidad.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-blue-400 mb-3 text-lg">2. Mecanismos de Adopción (El "Cómo")</h4>
            <p className="text-sm leading-relaxed mb-4">
              Detalla el mecanismo principal que usarás para que la comunidad adquiera los Activos.
            </p>

            <div className="space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <h5 className="font-medium text-yellow-400 mb-2">💵 A. Venta a Precio Fijo (Fixed Price)</h5>
                <div className="space-y-2">
                  <p className="text-sm leading-relaxed">
                    <strong>Mecánica:</strong> Los Activos de Creación se ofrecen a un precio predefinido (ej. $200 USD) hasta agotar existencias.
                  </p>
                  <p className="text-sm leading-relaxed text-green-400">
                    <strong>Uso ideal:</strong> Combínalo con una lista blanca (Whitelist) o un mecanismo de elegibilidad para evitar bots y recompensar a los primeros seguidores.
                  </p>
                  <p className="text-sm leading-relaxed text-blue-400">
                    <strong>Estrategia:</strong> Genera fondos predecibles para la Tesorería.
                  </p>
                </div>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                <h5 className="font-medium text-purple-400 mb-2">🎁 B. Airdrop / Asignación por Mérito</h5>
                <div className="space-y-2">
                  <p className="text-sm leading-relaxed">
                    <strong>Mecánica:</strong> Los Activos de Creación se distribuyen gratuitamente (o a un costo de gas mínimo) a wallets pre-seleccionadas que cumplen con criterios específicos (ej. participación en la comunidad, tenencia de otros NFTs relevantes, o cumplimiento de tareas previas).
                  </p>
                  <p className="text-sm leading-relaxed text-green-400">
                    <strong>Uso ideal:</strong> Ideal para recompensar la Labor histórica y construir una base de holders comprometidos.
                  </p>
                </div>
              </div>

              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                <h5 className="font-medium text-orange-400 mb-2">🏛️ C. Venta por Subasta u Oferta</h5>
                <div className="space-y-2">
                  <p className="text-sm leading-relaxed">
                    <strong>Mecánica:</strong> El precio de los Activos de Creación varía según la demanda (Subasta Holandesa, Subasta Inglesa, etc.).
                  </p>
                  <p className="text-sm leading-relaxed text-green-400">
                    <strong>Uso ideal:</strong> Determinar de forma orgánica el valor inicial del Acceso en un mercado sin precio fijo.
                  </p>
                </div>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <h5 className="font-medium text-red-400 mb-2">🔨 D. Venta Vinculada a la Labor (Proof-of-Work)</h5>
                <div className="space-y-2">
                  <p className="text-sm leading-relaxed">
                    <strong>Mecánica:</strong> El holder debe completar una tarea (Labor) antes de poder adquirir el Activo de Creación (ej. auditar un documento, compartir un pitch, referir a 5 personas). El pago puede ser obligatorio o reducido.
                  </p>
                  <p className="text-sm leading-relaxed text-blue-400">
                    <strong>Estrategia:</strong> Filtra a los flippers y garantiza que los primeros holders son colaboradores serios.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-green-400 mb-3 text-lg">3. Criterios de Elegibilidad (El "Quién")</h4>
            <p className="text-sm leading-relaxed mb-4">
              Para cada mecanismo, debes definir el criterio de elegibilidad.
            </p>

            <div className="space-y-3">
              <h5 className="font-medium text-white mb-2">Ejemplos:</h5>
              <ul className="text-sm space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-lime-400 mt-1">•</span>
                  <span><strong>Lista Blanca (Whitelist):</strong> Acceso restringido a wallets pre-aprobadas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-lime-400 mt-1">•</span>
                  <span><strong>Sorteo Público:</strong> Abierto a todos.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-lime-400 mt-1">•</span>
                  <span><strong>Propiedad de NFTs previas:</strong> Solo para holders de colecciones específicas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-lime-400 mt-1">•</span>
                  <span><strong>Métricas de Labor:</strong> Solo para usuarios que completaron más de 5 tareas en el período Beta.</span>
                </li>
              </ul>

              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 mt-4">
                <p className="text-sm leading-relaxed font-medium">
                  Tu plan debe ser una combinación clara de <strong>Mecanismo (cómo se compra/recibe)</strong> y <strong>Criterios (quién puede participar)</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      icon: '🚀'
    });
  }, []);

  return {
    openMechanicModal,
    openBenefitModal,
    openUtilityModal,
    openWorkToEarnModal,
    openLegalModal,
    openMonetizationModal,
    openMonetizationModalDetailed,
    openAdoptionStrategyModal,
    openAdoptionModal
  };
}
