/**
 * 🛰️ Pandora's Academy — Master Program: Telecomunicaciones, Redes e Intercepción de Señales
 * packages/academy-sdk/src/curriculum/signals-interception-master-program.ts
 *
 * Programa de Especialización de Grado Doctoral en Inteligencia de Señales (SIGINT),
 * Criptoanálisis de Red, Arquitectura de Telecomunicaciones y Defensa Soberana.
 * Acceso estrictamente restringido al Super Admin (Fundador / Sovereign Authority).
 */

import { AcademyProgram } from '../types';

export const SIGNALS_INTERCEPTION_MASTER_PROGRAM: AcademyProgram = {
  id: 'prog_sigint_telecom_interception_v1',
  code: 'SIGINT-NETWORKS-v1.0',
  title: 'Curso Magistral: Comunicaciones, Redes e Intercepción de Señales (SIGINT & Sovereign Cyber Defense)',
  description: 'Tratado doctoral exhaustivo sobre arquitectura de telecomunicaciones, propagación electromagnética, enrutamiento global BGP, señalización celular SS7/Diameter/5G, los 12 vectores de intercepción a nivel cable/radio/software, criptoanálisis de capas y OpSec soberano.',
  targetRole: 'SUPER_ADMIN',
  status: 'ACTIVE',
  version: 1,
  passingScore: 95,
  modules: [
    // ── MÓDULO 0: FUNDAMENTOS FÍSICOS, MATEMÁTICOS & LA FRONTERA CRIPTOGRÁFICA ────
    {
      id: 'mod_sigint_00_foundations',
      programId: 'prog_sigint_telecom_interception_v1',
      sequence: 0,
      code: 'MOD_0_FOUNDATIONS_PHYSICS_SIGNALS',
      title: 'Módulo 0 — Fundamentos Físicos, Ruido y el Principio Rector',
      description: 'Teoría de la información de Shannon, relación señal/ruido (SNR), modulación en fase y cuadratura (QAM/OFDM), y el axioma de la frontera criptográfica.',
      weightPercentage: 8,
      requiredKnowledgeDocs: ['SHANNON_1948_COMMUNICATION_THEORY', 'CRYPTOGRAPHIC_BOUNDARY_AXIOM_v1'],
      assessments: [
        {
          id: 'asm_sigint_00_shannon_limit',
          moduleId: 'mod_sigint_00_foundations',
          title: 'Caso Doctoral: Límite de Shannon y Ataques Pasivos en Medios Físicos Ruidosos',
          scenarioContext: `Un adversario estatal instala una antena direccional de alta ganancia (Yagi 2.4/5 GHz con LNA criogénico) a 400 metros de un centro de cómputo para capturar emanaciones Wi-Fi 6 (OFDM). La señal recibida está 12 dB por debajo del suelo de ruido ambiental. El equipo de seguridad afirma que "es imposible extraer datos porque el ruido destruye la información".`,
          questionPrompt: `Como Super Admin y Científico de Telecomunicaciones:
1. Explica matemáticamente con el Teorema de Shannon-Hartley (C = B * log2(1 + S/N)) por qué una señal por debajo del ruido térmico SÍ es recuperable mediante técnicas de espectro ensanchado (DSSS) y procesamiento de ganancias de integración por correlación cruzada.
2. Define el Principio Rector de la Frontera Criptográfica y demuestra por qué blindar el canal físico es fútil frente a un cifrado E2EE robusto en la capa de aplicación.
3. ¿Cuál es la única defensa matemáticamente inviolable según Claude Shannon (One-Time Pad / Cifrado de Vernam) y por qué sus restricciones de sincronización de entropía impiden su adopción masiva en redes públicas?`,
          rubricCriteria: [
            {
              id: 'rc_00_shannon_math',
              title: 'Dominio de Shannon-Hartley y Desensibilización',
              description: 'Demuestra matemáticamente que con suficiente ancho de banda o tiempo de integración, C > 0 incluso con S/N < 1.',
              maxScore: 35,
              evaluationGuideline: 'Debe explicar correlación coherente, ganancias de procesamiento y por qué SNR negativo no implica confidencialidad física.'
            },
            {
              id: 'rc_00_crypto_axiom',
              title: 'Articulación del Principio Rector',
              description: 'Formula que la seguridad solo existe en el punto exacto donde termina el cifrado de extremo a extremo verificado.',
              maxScore: 35,
              evaluationGuideline: 'Debe sentar la base del curso: abajo siempre hay alguien escuchando; la soberanía reside en el cómputo de los extremos.'
            },
            {
              id: 'rc_00_otp_entropy',
              title: 'Cifrado Perfecto vs Criptografía Computacional',
              description: 'Contrasta la seguridad incondicional del OTP con la seguridad condicional de algoritmos de clave pública y simétricos.',
              maxScore: 30,
              evaluationGuideline: 'Menciona teorema de Shannon sobre entropía de la clave H(K) >= H(M) y el problema logístico de distribución segura de claves.'
            }
          ],
          criticalFailureConditions: [
            'Afirmar que una señal por debajo del nivel de ruido ambiental es matemáticamente irrecuperable.',
            'Confundir seguridad física de la señal de radio con confidencialidad criptográfica.',
            'Sugerir que cambiar la frecuencia o usar canales ocultos sustituye al cifrado criptográfico autenticado.'
          ],
          passingThreshold: 90
        }
      ]
    },

    // ── MÓDULO 1: LA PILA DE CAPAS & LA VULNERABILIDAD ESTRUCTURAL ────────────────
    {
      id: 'mod_sigint_01_layer_stack',
      programId: 'prog_sigint_telecom_interception_v1',
      sequence: 1,
      code: 'MOD_1_OSI_TCPIP_TRUST_INVERSION',
      title: 'Módulo 1 — La Pila de Capas y el Fallo de Confianza Descendente',
      description: 'El modelo OSI de 7 capas vs TCP/IP. El principio de que cada capa asume ciegamente la integridad de la capa subyacente.',
      weightPercentage: 8,
      requiredKnowledgeDocs: ['RFC_791_IP', 'RFC_793_TCP', 'OSI_STRUCTURAL_TRUST_DEBT'],
      assessments: [
        {
          id: 'asm_sigint_01_layer_subversion',
          moduleId: 'mod_sigint_01_layer_stack',
          title: 'Diseño Arquitectónico: Inversión de Confianza en la Pila OSI',
          scenarioContext: `Un protocolo corporativo asegura que su capa de aplicación es 'inviolable' porque utiliza HTTPS con TLS 1.3. Sin embargo, el atacante tiene control sobre la Capa 2 (enlace) mediante inyección ARP y la Capa 3 (red) mediante control del servidor DHCP local.`,
          questionPrompt: `Como Arquitecto de Seguridad Ofensiva:
1. Explica detalladamente cómo un adversario en Capa 2 y 3 subvierte la comunicación sin romper la matemática de la curva elíptica de TLS 1.3 (e.g. DNS Poisoning combinado con SNI stripping, DoS selectivo para provocar fallback a protocolos inseguros, y explotación de metadatos de capa de transporte).
2. ¿Por qué la pila OSI carece ontológicamente de un mecanismo de atestación de capas inferiores?
3. Modela el flujo descendente (encapsulación) y ascendente (desencapsulación), señalando en qué capas se introducen identificadores persistentes no cifrados (MAC address, IP headers, TCP SYN options / JA4 fingerprints).`,
          rubricCriteria: [
            {
              id: 'rc_01_subversion_vectors',
              title: 'Subversión de Capas sin Romper Criptografía',
              description: 'Identifica ataques a metadatos, resolución de nombres y manipulación de rutas sin requerir factorización matemática.',
              maxScore: 35,
              evaluationGuideline: 'Debe citar SNI (Server Name Indication) en texto plano, fugas de DNS, y huellas digitales de transporte TCP.'
            },
            {
              id: 'rc_01_attestation_absence',
              title: 'Análisis Estructural del Diseño de Internet',
              description: 'Explica la deuda técnica de ARPANET: interoperabilidad priorizada sobre autenticación intrínseca.',
              maxScore: 35,
              evaluationGuideline: 'Argumenta con rigor el modelo de capas aisladas donde Capa N no puede verificar la honradez de Capa N-1.'
            },
            {
              id: 'rc_01_metadata_leakage',
              title: 'Mapeo Forense de Fuga de Metadatos',
              description: 'Enumera con exactitud los campos en claro que cada capa añade al paquete.',
              maxScore: 30,
              evaluationGuideline: 'Ethernet MAC (OUI), IP Source/Dest + TTL, TCP Window Size/Sequence, MSS, TLS SNI.'
            }
          ],
          criticalFailureConditions: [
            'Sostener que TLS 1.3 oculta la dirección IP de destino o el tamaño del paquete.',
            'Desconocer el rol de las tramas ARP en la resolución de Capa 2 a Capa 3.',
            'Ignorar que el SNI viaja en claro salvo en implementaciones experimentales de ECH (Encrypted Client Hello).'
          ],
          passingThreshold: 90
        }
      ]
    },

    // ── MÓDULO 2: EL VIAJE DEL PAQUETE & TOPOLOGÍA DEL BACKBONE GLOBAL ──────────
    {
      id: 'mod_sigint_02_packet_journey',
      programId: 'prog_sigint_telecom_interception_v1',
      sequence: 2,
      code: 'MOD_2_BGP_IXP_SUBSEA_INTERCEPTION',
      title: 'Módulo 2 — El Viaje de tu Paquete: Del Router al Cable Submarino',
      description: 'Topología física de Internet: CPE, DSLAM/OLT, Red de Agregación, BGP, IXPs (DE-CIX, AMS-IX), Tier-1 Transits y Cables Submarinos.',
      weightPercentage: 8,
      requiredKnowledgeDocs: ['BGP_4_SPECIFICATION_RFC_4271', 'SUBSEA_FIBER_OPTIC_TAPPING_TECHNIQUES'],
      assessments: [
        {
          id: 'asm_sigint_02_subsea_bgp_hijack',
          moduleId: 'mod_sigint_02_packet_journey',
          title: 'Análisis Forense: BGP Hijacking Intercontinental y Tapping de Fibra Óptica',
          scenarioContext: `Un bloque de direcciones IP /24 perteneciente a un banco soberano suizo es anunciado repentinamente por un ISP estatal ruso a través de BGP. Durante 38 minutos, el tráfico transatlántico procedente de EE. UU. viaja hacia Moscú antes de ser reenviado a Zurich sin que los clientes experimenten caída de servicio (ataque Man-in-the-Middle de BGP con re-anuncio de AS-PATH).`,
          questionPrompt: `Como Analista Estratégico de SIGINT:
1. Explica el mecanismo técnico de un BGP Hijack sigiloso (anuncio de prefijo más específico /24 vs /22, o manipulación de atributos Local Preference y AS-PATH prepending con reenvío transparente hacia el destino real).
2. Describe la física del 'Optical Fiber Bending Tap' y de los amplificadores submarinos EDFA (Erbium-Doped Fiber Amplifier): ¿cómo se intercepta un haz de luz de 1550 nm sin cortar el cable ni provocar una alarma por pérdida de potencia (OTDR)?
3. ¿Qué salvaguardas arquitectónicas como RPKI (Resource Public Key Infrastructure) y ROA (Route Origin Authorization) mitigan esto, y por qué aún más del 40% de las rutas globales son vulnerables?`,
          rubricCriteria: [
            {
              id: 'rc_02_bgp_mechanics',
              title: 'Mecanismo de Desviación BGP',
              description: 'Explica con precisión la regla del Longest Prefix Match y el desvío transparente con Proxy re-routing.',
              maxScore: 40,
              evaluationGuideline: 'Debe detallar cómo el tráfico es absorbido, clonado en un switch SPAN/TAP, y reinyectado hacia el destino legítimo para evitar sospechas.'
            },
            {
              id: 'rc_02_optical_physics',
              title: 'Física de Intercepción en Fibra Óptica',
              description: 'Detalla microcurvaturas (macro/micro-bending) y derivación por acopladores de 99:1 o 95:5.',
              maxScore: 35,
              evaluationGuideline: 'Explica la fuga de fotones por la cubierta de revestimiento (cladding) y cómo el margen de potencia del transceptor oculta la pérdida de 0.5 dB.'
            },
            {
              id: 'rc_02_rpki_governance',
              title: 'Gobernanza y Limitaciones de RPKI',
              description: 'Analiza la validación criptográfica de origen (ROV) y la persistencia de ataques de manipulación de AS-PATH (ASPA).',
              maxScore: 25,
              evaluationGuideline: 'Reconoce que RPKI valida el origen pero no el camino completo (AS-Path validation aún en despliegue temprano con ASPA).'
            }
          ],
          criticalFailureConditions: [
            'Creer que BGP verifica criptográficamente por defecto la legitimidad de las rutas anunciadas.',
            'Afirmar que intervenir un cable de fibra óptica requiere cortarlo físicamente.',
            'Ignorar el principio de Longest Prefix Match en las tablas de enrutamiento FIB/RIB.'
          ],
          passingThreshold: 90
        }
      ]
    },

    // ── MÓDULO 3: TELECOMUNICACIONES MÓVILES & ARQUITECTURA CELULAR ─────────────
    {
      id: 'mod_sigint_03_cellular_core',
      programId: 'prog_sigint_telecom_interception_v1',
      sequence: 3,
      code: 'MOD_3_GSM_LTE_5G_SS7_DIAMETER',
      title: 'Módulo 3 — El Viaje de tu Llamada: Torres, SIMs y la Red de Señalización SS7',
      description: 'Evolución de RAN: de BTS (2G) a gNodeB (5G). Core Networks: HLR/HSS, MSC, PGW, AMF. La debilidad fundacional de SS7 (Signaling System No. 7) y Diameter.',
      weightPercentage: 10,
      requiredKnowledgeDocs: ['3GPP_SECURITY_ARCHITECTURE_TS_33_501', 'SS7_ATTACK_SURFACE_METHODOLOGY'],
      assessments: [
        {
          id: 'asm_sigint_03_ss7_interception',
          moduleId: 'mod_sigint_03_cellular_core',
          title: 'Operación Táctica: Intercepción de Códigos 2FA por SMS vía SS7 MAP',
          scenarioContext: `Un atacante con acceso a un Global Title (GT) arrendado en un operador de telecomunicaciones de una pequeña isla del Pacífico emite mensajes de señalización SS7 para rastrear la ubicación e interceptar los SMS de verificación de una cuenta bancaria de un dignatario extranjero.`,
          questionPrompt: `Como Ingeniero de Seguridad en Telecomunicaciones:
1. Detalla el flujo exacto de mensajes SS7 MAP utilizados en este ataque: SendRoutingInfoForSM (SRI-SM) hacia el HLR de la víctima, UpdateLocation falso hacia el VLR del atacante, y captura del ForwardSM subsiguiente.
2. Explica por qué el cifrado de la interfaz de radio (e.g. A5/3 en 3G, EEA2 en LTE) es completamente inútil frente a este vector.
3. Compara las vulnerabilidades de SS7 en 2G/3G con el protocolo Diameter en 4G/LTE y el protocolo basado en HTTP/2 REST de la red de servicio 5G (Service-Based Architecture - SBA). ¿Resuelve 5G la intercepción de señalización o simplemente traslada el vector a la capa de API (SEPP)?`,
          rubricCriteria: [
            {
              id: 'rc_03_ss7_flow',
              title: 'Precisión Técnica en el Flujo SS7 MAP',
              description: 'Nombra y secuencia con exactitud primitiva los mensajes SRI-SM, InsertSubscriberData y MT-ForwardSM.',
              maxScore: 40,
              evaluationGuideline: 'Debe demostrar conocimiento de cómo el HLR almacena la dirección del VLR actual y cómo un spoofing redirige el SMS al switch del atacante.'
            },
            {
              id: 'rc_03_radio_vs_core',
              title: 'Desacoplamiento de Cifrado Radio vs Señalización',
              description: 'Demuestra que el cifrado radio solo cubre desde el teléfono hasta la estación base (BTS/eNodeB).',
              maxScore: 30,
              evaluationGuideline: 'El tráfico de voz y SMS en el Core Network viaja en texto plano en la red conmutada tradicional.'
            },
            {
              id: 'rc_03_diameter_5g_evolution',
              title: 'Evolución a Diameter y 5G SBA',
              description: 'Analiza los equivalentes en Diameter (ULR/ULA) y la arquitectura 5G con SEPP (Security Edge Protection Proxy).',
              maxScore: 30,
              evaluationGuideline: 'Identifica que si el SEPP o el operador extranjero no implementa filtrado estricto PRINS, la suplantación de señalización persiste en 5G.'
            }
          ],
          criticalFailureConditions: [
            'Confundir un ataque SS7 a nivel de red con un ataque de malware en el dispositivo telefónico.',
            'Creer que tener cobertura 4G o 5G previene los ataques de intercepción por SS7 de mensajes SMS.',
            'Ignorar el rol del HLR (Home Location Register) como base de datos canónica de enrutamiento celular.'
          ],
          passingThreshold: 90
        }
      ]
    },

    // ── MÓDULO 4: ANATOMÍA DE UNA INTERCEPCIÓN — LOS 12 PUNTOS CRÍTICOS ─────────
    {
      id: 'mod_sigint_04_twelve_interception_points',
      programId: 'prog_sigint_telecom_interception_v1',
      sequence: 4,
      code: 'MOD_4_THE_TWELVE_INTERCEPTION_VECTORS',
      title: 'Módulo 4 — Anatomía de una Intercepción: Los 12 Puntos Exactos de Ruptura',
      description: 'El mapa taxonómico completo: desde la radiofrecuencia local y los cables físicos hasta los implantes de hardware, BGP, CAs y CALEA.',
      weightPercentage: 12,
      requiredKnowledgeDocs: ['SIGINT_TAXONOMY_12_VECTORS_v1_0'],
      assessments: [
        {
          id: 'asm_sigint_04_vectors_matrix',
          moduleId: 'mod_sigint_04_twelve_interception_points',
          title: 'Auditoría Forense: Matriz de Vulnerabilidad de los 12 Vectores',
          scenarioContext: `Un ejecutivo de alta seguridad requiere comunicarse desde un hotel internacional en una zona hostil. Su esquema de comunicación consiste en: laptop conectada al Wi-Fi del hotel, usando una VPN comercial, y teléfono móvil con SIM local para llamadas y mensajes de voz.`,
          questionPrompt: `Como Auditor de Contrainteligencia Técnica:
1. Mapea la comunicación descrita contra los 12 vectores del curso:
   - V1 (RF Local), V2 (LAN MITM), V3 (Gateway/CPE), V4 (ISP Tapping), V5 (BGP Transit), V6 (Fibra Submarina),
   - V7 (IMSI Catcher), V8 (SS7/Diameter), V9 (DNS Poisoning), V10 (TLS CA Subversion), V11 (Lawful Interception CALEA), V12 (Hardware/Side-Channel).
2. Identifica cuáles vectores interceptan el tráfico del teléfono y cuáles el de la laptop.
3. Diseña una arquitectura de contramedida absoluta que anule simultáneamente los 12 vectores.`,
          rubricCriteria: [
            {
              id: 'rc_04_mapping_matrix',
              title: 'Mapeo Exhaustivo de los 12 Vectores',
              description: 'Asigna cada elemento de la infraestructura a los vectores de intercepción correspondientes sin omisiones.',
              maxScore: 40,
              evaluationGuideline: 'Debe demostrar comprensión del alcance de cada vector en radio, enlace, tránsito, núcleo celular y terminal.'
            },
            {
              id: 'rc_04_differential_analysis',
              title: 'Análisis Diferencial Laptop vs Smartphone',
              description: 'Distingue con precisión qué vectores aplican a la red celular (V7, V8, V11) frente a la red Wi-Fi/VPN (V1, V2, V3, V9, V10).',
              maxScore: 30,
              evaluationGuideline: 'Evita generalizaciones; muestra exactamente dónde la VPN protege (contenido Capa 3-7 en ISP/BGP) y dónde falla (metadatos, endpoints V12).'
            },
            {
              id: 'rc_04_sovereign_countermeasure',
              title: 'Arquitectura de Defensa Unificada',
              description: 'Estructura una pila compuesta por hardware dedicado, túneles multicapa cifrados y OpSec estricto.',
              maxScore: 30,
              evaluationGuideline: 'Combina hardware air-gapped/aislado, E2EE auditado, DNS autenticado, Faraday bags y perfiles de red compartimentados.'
            }
          ],
          criticalFailureConditions: [
            'Omitir cualquiera de los 12 vectores en la matriz de análisis.',
            'Afirmar que una VPN comercial anula los vectores de red celular como IMSI Catchers o SS7.',
            'Suponer que el cifrado de la aplicación protege contra implantes de hardware en el dispositivo terminal.'
          ],
          passingThreshold: 90
        }
      ]
    },

    // ── MÓDULO 5: EL ESLABÓN LEGAL, ESTATAL Y LAWFUL INTERCEPTION ───────────────
    {
      id: 'mod_sigint_05_state_legal_intercept',
      programId: 'prog_sigint_telecom_interception_v1',
      sequence: 5,
      code: 'MOD_5_CALEA_ETSI_STATE_SURVEILLANCE',
      title: 'Módulo 5 — El Eslabón Estatal: CALEA, IMSI Catchers y Acceso Directo de Operador',
      description: 'Arquitectura de intercepción legal (Lawful Interception - LI) según estándares ETSI y CALEA. Puntos de captura X1, X2 y X3 en conmutadores. IMSI Catchers (StingRay) y software espía mercenario (Pegasus).',
      weightPercentage: 10,
      requiredKnowledgeDocs: ['ETSI_TS_102_232_LI_HANDOVER', 'CALEA_ARCHITECTURE_SPECIFICATION'],
      assessments: [
        {
          id: 'asm_sigint_05_lawful_interception_architecture',
          moduleId: 'mod_sigint_05_state_legal_intercept',
          title: 'Diseño Institucional: Arquitectura de Handover Interfaces (HI1, HI2, HI3)',
          scenarioContext: `Un gran operador de telecomunicaciones implementa la arquitectura estandarizada por el ETSI para cumplir con mandatos judiciales de interceptación. La infraestructura divide el proceso en Internal Interception Function (IIF), Mediation Function (MF) y Delivery Function (DF).`,
          questionPrompt: `Como Experto en Sistemas de Telecomunicaciones y Regulación Estatal:
1. Explica la separación de planos en Lawful Interception: HI1 (Información de la orden administrativa/judicial), HI2 (Intercept Related Information - IRI: metadatos, números marcados, torres, timestamp) y HI3 (Content of Communication - CC: audio de voz en PCM o paquetes de datos crudos).
2. ¿Por qué un operador telefónico está legalmente obligado por diseño de ingeniería a tener puertas traseras en su infraestructura central (switches Ericsson, Nokia, Huawei, Cisco)?
3. Explica el funcionamiento de un IMSI Catcher (e.g. StingRay): ¿cómo manipula los parámetros de radiofrecuencia (C1/C2 selection criteria, LAC spoofing) para forzar a un terminal a registrarse en su celda falsa y cómo ejecuta un downgrade forzado a 2G con cifrado desactivado (A5/0)?`,
          rubricCriteria: [
            {
              id: 'rc_05_li_planes',
              title: 'Dominio de Interfaces ETSI/CALEA',
              description: 'Detalla las funciones de HI1, HI2 e HI3 y cómo los conmutadores duplican el flujo sin alterar la latencia audible.',
              maxScore: 35,
              evaluationGuideline: 'Explica los puntos de duplicación en switches MSC/SGW y el envío en túneles IP dedicados a las agencias policiales.'
            },
            {
              id: 'rc_05_telecom_backdoors',
              title: 'Realidad Estructural de las Puertas Traseras de Operador',
              description: 'Argumenta cómo la licencia de operación de una telco exige compatibilidad con LI a nivel de hardware y firmware.',
              maxScore: 30,
              evaluationGuideline: 'Desmitifica la idea de "hackeo": la intercepción estatal no es un exploit, es una función nativa del conmutador comprada al fabricante.'
            },
            {
              id: 'rc_05_imsi_catcher_physics',
              title: 'Ingeniería Ofensiva de IMSI Catchers',
              description: 'Explica el mecanismo de selección de celda (Broadcast Control Channel - BCCH) y el fallo de autenticación unidireccional en 2G.',
              maxScore: 35,
              evaluationGuideline: 'En 2G, el teléfono autentica a la red, pero el teléfono nunca puede autenticar si la torre es legítima. Explica A5/0 y supresión de cifrado.'
            }
          ],
          criticalFailureConditions: [
            'Confundir metadatos (HI2/IRI) con contenido de audio (HI3/CC).',
            'Creer que un IMSI Catcher requiere autorización o claves privadas del operador para capturar identidades en radio.',
            'Ignorar que en GSM (2G) la autenticación es asimétrica y no protege al terminal contra torres falsas.'
          ],
          passingThreshold: 90
        }
      ]
    },

    // ── MÓDULO 6: ATAQUES CONCRETOS & CADENAS DE EXPLOTACIÓN PRÁCTICAS ──────────
    {
      id: 'mod_sigint_06_concrete_attacks',
      programId: 'prog_sigint_telecom_interception_v1',
      sequence: 6,
      code: 'MOD_6_OFFENSIVE_EXPLOITATION_CHAINS',
      title: 'Módulo 6 — Ataques Concretos: De ARP Spoofing y SSL Stripping a Downgrade Celular',
      description: 'Técnicas ofensivas reales desglosadas a nivel de bytes: ARP cache poisoning, rogue DHCP, DNS cache poisoning (Kaminsky), SSL stripping moderno (HSTS bypass), SIM swapping y suplantación de certificados CA.',
      weightPercentage: 12,
      requiredKnowledgeDocs: ['OFFENSIVE_ATTACK_PLAYBOOK_SIGINT_v1', 'RFC_6797_HSTS_SECURITY_LIMITS'],
      assessments: [
        {
          id: 'asm_sigint_06_exploit_chain_mitm',
          moduleId: 'mod_sigint_06_concrete_attacks',
          title: 'Laboratorio Forense: Cadena Completa de MITM en Red Local y Bypass de HSTS',
          scenarioContext: `Un atacante se encuentra en la misma red Wi-Fi de un hotel que la víctima. Su objetivo es capturar credenciales de acceso hacia un portal corporativo que implementa HTTPS con HSTS activado en su encabezado HTTP.`,
          questionPrompt: `Como Analista Forense y Creador de Exploits:
1. Diseña la cadena de ataque paso a paso:
   - Inyección de paquetes ARP gratuitos falsos hacia la víctima y el gateway.
   - Activación de IP Forwarding con iptables/nftables para evitar desconexión.
   - Mecanismo de DNS Spoofing o manipulación proxy con herramientas tipo SSLSplit/Bettercap.
2. Explica cómo opera el ataque de 'SSL Strip' original y por qué HSTS (HTTP Strict Transport Security) lo neutraliza si el navegador tiene la bandera activada.
3. ¿Cómo un atacante moderno supera HSTS utilizando técnicas de 'Homograph / Typo Domain Injection' o 'SSLstrip+' (sustitución en tiempo real de URLs seguras por variantes no seguras o subdominios alternativos no preloaded)?
4. ¿Qué ocurre si el atacante instala una Autoridad de Certificación (CA) raíz corporativa en el almacén de certificados del sistema operativo de la víctima?`,
          rubricCriteria: [
            {
              id: 'rc_06_arp_mechanics',
              title: 'Precisión en Layer 2 Poisoning',
              description: 'Explica el envío continuo de respuestas ARP no solicitadas (gratuitous ARP) para envenenar la tabla de vecinos.',
              maxScore: 25,
              evaluationGuideline: 'Detalla cómo el atacante suplanta la dirección MAC del default gateway para absorber todo el tráfico saliente.'
            },
            {
              id: 'rc_06_sslstrip_hsts',
              title: 'Dinámica de SSLStrip vs HSTS',
              description: 'Explica la degradación de enlaces HTTPS a HTTP y el rol de los navegadores al forzar conexiones cifradas.',
              maxScore: 25,
              evaluationGuideline: 'Muestra que SSLStrip intercepta la respuesta 301/302 Redirect o enlaces internos y los convierte a HTTP plano antes de que el usuario los vea.'
            },
            {
              id: 'rc_06_hsts_bypass',
              title: 'Bypass Avanzado de HSTS Preloading',
              description: 'Detalla la técnica de sslstrip+ modificando subdominios (e.g. login.banco.com -> wlogin.banco.com) para evadir las listas de precarga.',
              maxScore: 25,
              evaluationGuideline: 'Explica que HSTS solo protege los dominios exactos listados y cómo dominios sintéticos evaden la regla estricta.'
            },
            {
              id: 'rc_06_rogue_ca',
              title: 'El Escenario de CA Raíz Subvertida',
              description: 'Analiza el MITM perfecto mediante una CA de confianza instalada en el trust store local (e.g. perfiles MDM corporativos).',
              maxScore: 25,
              evaluationGuideline: 'Si la CA raíz es de confianza del SO, el navegador valida el certificado generado al vuelo sin mostrar ninguna advertencia al usuario.'
            }
          ],
          criticalFailureConditions: [
            'Confundir un ataque de denegación de servicio con un ataque MITM con reenvío de tráfico activo.',
            'Afirmar que un certificado TLS puede ser descifrado sin la clave privada o sin una CA de confianza intermedia.',
            'Desconocer el propósito del mecanismo de Certificate Pinning para neutralizar CAs corporativas abusivas.'
          ],
          passingThreshold: 90
        }
      ]
    },

    // ── MÓDULO 7: DEFENSA REAL, CRIPTOGRAFÍA & BLINDAJE DE INFRAESTRUCTURA ───────
    {
      id: 'mod_sigint_07_real_defense',
      programId: 'prog_sigint_telecom_interception_v1',
      sequence: 7,
      code: 'MOD_7_DEFENSIVE_ARCHITECTURE_CRYPTO_HARDENING',
      title: 'Módulo 7 — Defensa Real: Criptografía, VPNs, Tor, Signal y Blindaje Físico',
      description: 'Protocolos de blindaje: Double Ratchet de Signal, X3DH, WireGuard vs OpenVPN, Onion Routing, DNS sobre HTTPS (DoH/DoT), DNSSEC, Certificate Pinning y hardware de aislamiento.',
      weightPercentage: 12,
      requiredKnowledgeDocs: ['SIGNAL_DOUBLE_RATCHET_SPEC', 'WIREGUARD_PROTOCOL_SECURITY_PAPER', 'TOR_RENDEZVOUS_PROTOCOL'],
      assessments: [
        {
          id: 'asm_sigint_07_sovereign_defense_stack',
          moduleId: 'mod_sigint_07_real_defense',
          title: 'Ingeniería Defensiva: Construcción de una Pila Antagonista Soberana',
          scenarioContext: `Una organización soberana debe desplegar un enclave de comunicaciones para sus directores en un entorno de vigilancia masiva pasiva y activa por parte de agencias estatales con capacidades de nivel Tier-1.`,
          questionPrompt: `Como Director de Seguridad Criptográfica y Arquitecto de Sistemas:
1. Explica el funcionamiento matemático y estructural del protocolo Signal Double Ratchet: ¿por qué combina un Diffie-Hellman Ratchet con un KDF Ratchet simétrico para proporcionar Perfect Forward Secrecy (PFS) y Future Secrecy (Break-in Recovery)?
2. Compara WireGuard con Tor: ¿en qué escenario de amenaza una VPN es completamente insuficiente frente al análisis de tráfico y correlación de paquetes temporales de un adversario global pasivo, y por qué Tor utiliza células de longitud fija y capas de cifrado anidadas para neutralizarlo?
3. Define una política estricta de DNS y TLS: DoH con servidores autenticados no censurables, Certificate Transparency Logs, y Certificate Pinning en aplicaciones nativas para inutilizar cualquier intento de intercepción con CAs estatales o corporativas.`,
          rubricCriteria: [
            {
              id: 'rc_07_double_ratchet',
              title: 'Rigor Matemático en Double Ratchet',
              description: 'Explica la renovación continua de claves con cada mensaje enviado y recibido.',
              maxScore: 40,
              evaluationGuideline: 'Debe detallar cómo el compromiso de una clave efímera solo expone un mensaje y cómo el ratchet de curva elíptica sana la sesión de inmediato.'
            },
            {
              id: 'rc_07_vpn_vs_tor_traffic_analysis',
              title: 'Análisis de Tráfico Global y Tor',
              description: 'Demuestra por qué una VPN no oculta los metadatos temporales de entrada y salida contra un adversario con visión de AS.',
              maxScore: 35,
              evaluationGuideline: 'Explica los circuitos de tres saltos (Guard, Middle, Exit) de Tor, la negociación de claves por salto y la eliminación de correlación de paquetes.'
            },
            {
              id: 'rc_07_dns_tls_pinning',
              title: 'Blindaje de Capa de Aplicación',
              description: 'Estructura el uso combinado de DoH/DoT, DNSSEC y pinning de claves públicas (SPKI Pinning).',
              maxScore: 25,
              evaluationGuideline: 'Muestra que el pinning rechaza conexiones incluso si el atacante presenta un certificado firmado por una CA de confianza del sistema.'
            }
          ],
          criticalFailureConditions: [
            'Afirmar que una VPN comercial provee anonimato frente a un adversario estatal global.',
            'Desconocer la diferencia entre Perfect Forward Secrecy (PFS) y Future Secrecy.',
            'Creer que HTTPS por sí solo oculta los nombres de dominio consultados en el DNS tradicional sin DoH.'
          ],
          passingThreshold: 90
        }
      ]
    },

    // ── MÓDULO 8: OPSEC TÁCTICO, MODELO DE AMENAZA & COMPARTIMENTACIÓN ──────────
    {
      id: 'mod_sigint_08_opsec_threat_model',
      programId: 'prog_sigint_telecom_interception_v1',
      sequence: 8,
      code: 'MOD_8_TACTICAL_OPSEC_THREAT_MODELING',
      title: 'Módulo 8 — OpSec y Modelo de Amenaza: Contra Quién te Defiendes Determina Todo',
      description: 'El núcleo de la supervivencia operativa: modelado de adversarios (vecino, cibercriminal, corporación, Estado Tier-1). Análisis de metadatos, correlación de tiempos, compartimentación de identidades y protocolos de descarte (Burner).',
      weightPercentage: 10,
      requiredKnowledgeDocs: ['THE_GUGGENHEIM_OPSEC_DOCTRINE', 'METADATA_ANALYSIS_AND_LINK_GRAPHS'],
      assessments: [
        {
          id: 'asm_sigint_08_opsec_execution',
          moduleId: 'mod_sigint_08_opsec_threat_model',
          title: 'Plan de Operaciones: Diseño de Protocolo de Compartimentación Extrema',
          scenarioContext: `Un operador soberano debe gestionar dos identidades que jamás deben ser vinculadas: su identidad física y legal en su país de residencia, y una identidad institucional para la administración de activos soberanos y comunicaciones críticas.`,
          questionPrompt: `Como Maestro de OpSec y Contrainteligencia:
1. Analiza el axioma de Michael Hayden (ex director de la NSA): 'We kill people based on metadata'. Explica por qué el cifrado de contenido es secundario si los metadatos (ubicación celular coincidente en antenas BTS, grafo social de llamadas, horarios de conexión y estilo de tipeo) revelan la correlación de identidades.
2. Desarrolla un protocolo estricto de 'Hardware Burner' y compartimentación de radio: ¿por qué llevar dos teléfonos juntos en el mismo bolsillo destruye instantáneamente la separación de identidades en las bases de datos de triangulación de la operadora?
3. Redacta las 5 Reglas Cardinales de OpSec para comunicaciones soberanas que deben ser memorizadas y cumplidas sin excepción.`,
          rubricCriteria: [
            {
              id: 'rc_08_metadata_fatalism',
              title: 'Análisis Crítico de Metadatos y Grafos',
              description: 'Demuestra cómo la analítica de grafos y coincidencia de celda GSM desanonimiza sin leer el contenido de los mensajes.',
              maxScore: 40,
              evaluationGuideline: 'Debe explicar correlación de Call Detail Records (CDR) y coincidencia espacial de geolocalización por IMSI/IMEI.'
            },
            {
              id: 'rc_08_radio_discipline',
              title: 'Disciplina Rigurosa de Radiofrecuencia',
              description: 'Explica el principio de contigüidad espacial: dos dispositivos emitiendo en el mismo radio geográfico son la misma persona para el algoritmo.',
              maxScore: 30,
              evaluationGuideline: 'Detalla el uso de bolsas de Faraday, encendido exclusivo en ubicaciones públicas no asociadas y rotación de hardware.'
            },
            {
              id: 'rc_08_cardinal_rules',
              title: 'Formulación de las 5 Reglas Cardinales de OpSec',
              description: 'Sintetiza una doctrina pragmática, memorable y rigurosa para operar en entornos adversariales.',
              maxScore: 30,
              evaluationGuideline: 'Debe incluir: No mezclar canales, Asumir escucha en capas bajas, Compartimentar identidades, Rotar superficies y Cifrado E2EE verificado.'
            }
          ],
          criticalFailureConditions: [
            'Creer que usar una app cifrada como Signal protege si el teléfono tiene el GPS activado y comparte celda con la identidad real.',
            'Encender un teléfono "limpio" en el domicilio habitual del operador.',
            'Subestimar el poder predictivo del análisis de grafos y correlación temporal de CDRs.'
          ],
          passingThreshold: 90
        }
      ]
    },

    // ── MÓDULO 9 (DOCTORAL AVANZADO): CRIPTOANÁLISIS & PRIMITIVAS POST-CUÁNTICAS ─
    {
      id: 'mod_sigint_09_post_quantum_crypto',
      programId: 'prog_sigint_telecom_interception_v1',
      sequence: 9,
      code: 'MOD_9_POST_QUANTUM_LATTICE_PQC',
      title: 'Módulo 9 — Criptoanálisis Avanzado y Primitivas Post-Cuánticas',
      description: 'El impacto del Algoritmo de Shor sobre RSA y Curvas Elípticas (ECDH/ECDSA). Ataques de cosecha masiva "Harvest Now, Decrypt Later". Criptografía basada en retículos (ML-KEM / Kyber, ML-DSA / Dilithium) y side-channel timing attacks.',
      weightPercentage: 6,
      requiredKnowledgeDocs: ['NIST_PQC_FIPS_203_ML_KEM', 'SHOR_ALGORITHM_IMPACT_ANALYSIS'],
      assessments: [
        {
          id: 'asm_sigint_09_pqc_harvest_now',
          moduleId: 'mod_sigint_09_post_quantum_crypto',
          title: 'Defensa Estratégica: Mitigación de Ataques "Harvest Now, Decrypt Later"',
          scenarioContext: `Agencias de inteligencia globales almacenan petabytes de tráfico cifrado capturado en cables submarinos (programas FAIRVIEW y TEMPORA), a la espera de que ordenadores cuánticos con corrección de errores (FTQC) ejecuten el algoritmo de Shor dentro de 5 a 10 años.`,
          questionPrompt: `Como Científico Criptógrafo de Pandora's:
1. Explica matemáticamente por qué el algoritmo de Shor reduce la complejidad de calcular logaritmos discretos en curvas elípticas de tiempo exponencial a tiempo polinomial O((log N)^3).
2. ¿Cómo funciona la arquitectura híbrida X25519 + ML-KEM-768 (Kyber) para intercambio de claves y por qué garantiza seguridad incluso si una de las dos primitivas colapsa?
3. Analiza los ataques de canal lateral (Side-Channel Timing Attacks) en implementaciones de retículos y la importancia de operaciones en tiempo constante (Constant-Time Polynomial Arithmetic).`,
          rubricCriteria: [
            {
              id: 'rc_09_shor_math',
              title: 'Matemática del Algoritmo de Shor',
              description: 'Explica la transformación cuántica de Fourier (QFT) y la búsqueda del período para resolver el logaritmo discreto.',
              maxScore: 35,
              evaluationGuideline: 'Demuestra por qué ECC (Curvas Elípticas) y RSA quedan totalmente rotos frente a computación cuántica.'
            },
            {
              id: 'rc_09_hybrid_kex',
              title: 'Intercambio de Claves Híbrido PQC',
              description: 'Modela la combinación de secretos compartidos K = KDF(SS_Classic || SS_Quantum).',
              maxScore: 35,
              evaluationGuideline: 'Muestra que el secreto final es seguro mientras al menos uno de los dos problemas matemáticos subyacentes permanezca irresoluble.'
            },
            {
              id: 'rc_09_side_channel',
              title: 'Canal Lateral y Tiempo Constante',
              description: 'Analiza fugas de microsegundos en el muestreo de ruido gaussiano en Learning With Errors (LWE).',
              maxScore: 30,
              evaluationGuideline: 'Explica cómo un adversario recupera el vector secreto midiendo tiempos de respuesta de memoria caché o CPU.'
            }
          ],
          criticalFailureConditions: [
            'Creer que el cifrado simétrico AES-256 es vulnerable a Shor en lugar de Grover (Grover solo reduce la seguridad a la mitad, requiriendo AES-256 para preservar 128 bits cuánticos).',
            'Confundir un Key Encapsulation Mechanism (KEM) con una firma digital post-cuántica (DSA).',
            'Implementar algoritmos criptográficos sin primitivas de tiempo constante.'
          ],
          passingThreshold: 90
        }
      ]
    },

    // ── MÓDULO 10 (DOCTORAL AVANZADO): HARDWARE IMPLANTS & TEMPEST EMANATIONS ───
    {
      id: 'mod_sigint_10_hardware_tempest',
      programId: 'prog_sigint_telecom_interception_v1',
      sequence: 10,
      code: 'MOD_10_HARDWARE_IMPLANTS_TEMPEST',
      title: 'Módulo 10 — Baseband Exploitation, Hardware Implants y Emanaciones TEMPEST',
      description: 'El procesador Baseband RTOS como vector independiente del sistema operativo. Ataques over-the-air a microcódigo. Implantes PCIe/DMA, intercepción JTAG y reconstrucción de información por emanaciones electromagnéticas no intencionales (TEMPEST / Van Eck Phreaking).',
      weightPercentage: 6,
      requiredKnowledgeDocs: ['TEMPEST_NATO_SDIP_27_SPECIFICATION', 'CELLULAR_BASEBAND_EXPLOITATION_v1'],
      assessments: [
        {
          id: 'asm_sigint_10_baseband_tempest',
          moduleId: 'mod_sigint_10_hardware_tempest',
          title: 'Contrainteligencia Técnica: Análisis de Ataques Baseband y Fugas TEMPEST',
          scenarioContext: `Un teléfono inteligente moderno mantiene su procesador de aplicaciones (iOS/Android) apagado en modo avión. Sin embargo, el módem de banda base (Qualcomm/MediaTek) ejecuta un sistema operativo en tiempo real (RTOS QuRT/Nucleus) con acceso directo a la memoria RAM compartida mediante DMA.`,
          questionPrompt: `Como Ingeniero de Hardware y Seguridad Táctica:
1. Explica la arquitectura de memoria compartida entre el Application Processor (AP) y el Baseband Processor (BP). ¿Por qué un exploit over-the-air vía SMS malicioso de clase 0 puede tomar control de la memoria RAM del sistema operativo principal sin interacción del usuario?
2. ¿Qué es el fenómeno TEMPEST (Van Eck Phreaking)? Explica cómo una antena de software SDR (Software Defined Radio) puede capturar las radiaciones electromagnéticas de un cable HDMI o las pistas de un bus de datos de memoria para reconstruir la imagen en pantalla a 15 metros de distancia a través de paredes de concreto.
3. Diseña las especificaciones de una jaula de Faraday y un búnker con blindaje RF conforme a la norma NATO SDIP-27 Nivel A (TEMPEST Zone 0).`,
          rubricCriteria: [
            {
              id: 'rc_10_baseband_dma',
              title: 'Arquitectura Baseband y DMA Exploits',
              description: 'Detalla cómo el módem celular opera como un subsistema autónomo con privilegios de bus maestro sobre la memoria.',
              maxScore: 40,
              evaluationGuideline: 'Explica el desbordamiento de búfer en analizadores de mensajes ASN.1 del stack celular y la escritura en memoria del host.'
            },
            {
              id: 'rc_10_tempest_physics',
              title: 'Física Electromagnética de TEMPEST',
              description: 'Explica la radiación parásita de señales digitales de alta frecuencia y su demodulación en receptores AM/FM o SDR.',
              maxScore: 35,
              evaluationGuideline: 'Demuestra cómo la tasa de refresco y la modulación de pixel clock generan armónicos sintonizables en el espectro de radio.'
            },
            {
              id: 'rc_10_faraday_shielding',
              title: 'Ingeniería de Aislamiento Electromagnético',
              description: 'Especifica atenuación en decibelios (dB), filtros de línea de alimentación eléctrica, juntas de berilio-cobre y guías de onda.',
              maxScore: 25,
              evaluationGuideline: 'Atenuación mínima de 100 dB en el rango de 10 kHz a 10 GHz para recintos TEMPEST certificados.'
            }
          ],
          criticalFailureConditions: [
            'Suponer que el modo avión desactiva físicamente la alimentación del procesador de banda base en todos los dispositivos comerciales.',
            'Creer que el cifrado de disco protege contra ataques de acceso directo a memoria (DMA) por hardware.',
            'Desconocer el principio de propagación de armónicos RF en conductores metálicos no apantallados.'
          ],
          passingThreshold: 90
        }
      ]
    },

    // ── MÓDULO 11 (DOCTORAL AVANZADO): REDES SOBERANAS, MESH & CANALES CLANDESTINOS
    {
      id: 'mod_sigint_11_sovereign_mesh',
      programId: 'prog_sigint_telecom_interception_v1',
      sequence: 11,
      code: 'MOD_11_SOVEREIGN_MESH_AIRGAP_CHANNELS',
      title: 'Módulo 11 — Redes Soberanas, Mesh Clandestinas y Canales Fuera de Banda',
      description: 'Construcción de infraestructura de comunicaciones sin ISPs ni torres celulares: redes malladas LoRaWAN/Meshtastic (868/915 MHz), enrutamiento por inundación cifrado AES-256-CTR, esteganografía de paquetes y exfiltración acústica/óptica en sistemas Air-Gapped.',
      weightPercentage: 6,
      requiredKnowledgeDocs: ['LORA_SPREAD_SPECTRUM_PHYSICAL_LAYER', 'STEGANOGRAPHIC_COVERT_CHANNELS_v1'],
      assessments: [
        {
          id: 'asm_sigint_11_clandestine_mesh',
          moduleId: 'mod_sigint_11_sovereign_mesh',
          title: 'Despliegue Táctico: Red Mesh Descentralizada Inmune a Censura Estatal',
          scenarioContext: `Durante una situación de crisis geopolítica, el gobierno anfitrión apaga completamente Internet (Internet Kill Switch), ordena el cese de transmisiones a las operadoras celulares y bloquea la navegación por satélite (GPS spoofing). Una unidad soberana debe mantener comunicaciones coordinadas en un radio urbano de 15 kilómetros.`,
          questionPrompt: `Como Ingeniero de Redes Clandestinas y Comunicaciones Tácticas:
1. Diseña una red mesh ad-hoc basada en modulación LoRa (Chirp Spread Spectrum - CSS) en la banda libre ISM (915 MHz en América / 868 MHz en Europa):
   - Justifica la elección de Spreading Factor (SF7 a SF12) en función del trade-off entre tasa de bits y sensibilidad en decibelios (-137 dBm).
   - Estructura el protocolo de enrutamiento por saltos con balanceo de ciclo de trabajo (Duty Cycle) y cifrado de paquetes E2EE con claves pre-compartidas o ECDH efímero.
2. ¿Cómo neutraliza esta arquitectura los vectores de intercepción convencionales (V2, V3, V4, V5, V6, V7, V8, V9, V10, V11)?
3. Diseña un canal de comunicación acústico o LED infrarrojo fuera de banda (Air-Gap Bridge) para transferir claves criptográficas entre dos computadoras físicamente aisladas sin utilizar cables, Bluetooth ni Wi-Fi.`,
          rubricCriteria: [
            {
              id: 'rc_11_lora_mesh_architecture',
              title: 'Ingeniería de Radio LoRa y Mesh',
              description: 'Demuestra dominio de modulación CSS, factores de ensanchamiento, ancho de banda y presupuestos de enlace (Link Budget).',
              maxScore: 40,
              evaluationGuideline: 'Explica cómo LoRa demodula por debajo del nivel de ruido térmico y cómo los saltos mesh multiplican el alcance en entornos densos.'
            },
            {
              id: 'rc_11_vector_immunity',
              title: 'Análisis de Inmunidad frente a la Matriz de los 12 Vectores',
              description: 'Demuestra que al no depender de telecomunicaciones comerciales, se suprimen 10 de los 12 vectores tradicionales.',
              maxScore: 30,
              evaluationGuideline: 'Solo persisten V1 (intercepción RF local, mitigable con cifrado y baja probabilidad de intercepción LPI) y V12 (hardware local).'
            },
            {
              id: 'rc_11_airgap_covert_channel',
              title: 'Diseño de Canal Encubierto Fuera de Banda',
              description: 'Formula protocolos de modulación de audio ultrasonido (18-24 kHz) o LED con verificación de redundancia cíclica (CRC) y Reed-Solomon.',
              maxScore: 30,
              evaluationGuideline: 'Explica la tasa de transferencia, resistencia a reflexiones y aislamiento absoluto frente a redes IP conectadas.'
            }
          ],
          criticalFailureConditions: [
            'Proponer el uso de redes celulares o satélites comerciales que dependan de pasarelas terrestres controladas por el estado.',
            'Ignorar las limitaciones de ancho de banda de LoRa (cientos de bytes por segundo, apto para texto y comandos, no para streaming).',
            'Omitir la firma criptográfica o autenticación de mensajes en una red mesh que opera por inundación (riesgo de flooding DoS).'
          ],
          passingThreshold: 90
        }
      ]
    }
  ]
};
