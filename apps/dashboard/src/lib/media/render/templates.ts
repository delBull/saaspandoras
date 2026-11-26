/**
 * 🎨 Plantillas de media (ADR-020 §2.3-bis)
 *
 * Funciones puras que devuelven el árbol de elementos para Satori (`next/og`).
 * El mismo árbol lo usan la ruta de render y el script de previsualización, así
 * lo que se revisa en local es exactamente lo que se publica.
 *
 * Identidad: se recibe el brand kit del tenant; nada de colores fijos por marca.
 */

export type TemplateId = 'cover' | 'statement' | 'levels' | 'cta';

export const TEMPLATE_IDS: TemplateId[] = ['cover', 'statement', 'levels', 'cta'];

export interface BrandKit {
  background: string;
  gold: string;
  text: string;
  muted: string;
  logoUrl: string | null;
  name: string;
}

export interface TemplateProps {
  template: TemplateId;
  brand: BrandKit;
  lines: string[];
  goldLine?: number | null;
  kicker?: string | null;
  body?: string | null;
  imageUrl?: string | null;
  /** Fondo fotográfico con velo (statement/cta). */
  backgroundImage?: string | null;
  /** Cuatro imágenes para las tarjetas de `levels` (una por nivel). */
  cardImages?: string[] | null;
  phone?: string | null;
  width: number;
  height: number;
}

const FONT_HEAD = 'Playfair';
// Satori (esta versión) falla con las sans que probamos (Inter, Roboto, DM Sans, Manrope):
// GSUB no soportado. Playfair sí renderiza estable en sus tres pesos, así que la
// identidad usa serif también en el cuerpo. Cambiar aquí cuando haya una sans compatible.
const FONT_BODY = 'Playfair';

export const LEVELS = ['Explorador', 'Residente', 'Embajador', 'Riviera Owner'];

function LogoRow({ brand }: { brand: BrandKit }) {
  return {
    type: 'div',
    props: {
      style: { display: 'flex', alignItems: 'center', gap: 18 },
      children: [
        ...(brand.logoUrl
          ? [
              {
                type: 'img',
                props: {
                  src: brand.logoUrl,
                  width: 64,
                  height: 64,
                  style: { objectFit: 'contain' as const },
                },
              },
            ]
          : []),
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column' as const, gap: 6 },
            children: [
              {
                type: 'span',
                props: {
                  style: { fontSize: 26, letterSpacing: 10, color: brand.text, fontFamily: FONT_BODY },
                  children: 'S’NARAI',
                },
              },
              {
                type: 'span',
                props: {
                  style: { fontSize: 13, letterSpacing: 6, color: brand.muted, fontFamily: FONT_BODY },
                  children: 'RIVIERA NAYARIT',
                },
              },
            ],
          },
        },
      ],
    },
  };
}

function Kicker({ text, brand }: { text: string; brand: BrandKit }) {
  return {
    type: 'div',
    props: {
      style: { display: 'flex', alignItems: 'center', gap: 16 },
      children: [
        { type: 'div', props: { style: { display: 'flex', width: 56, height: 2, background: brand.gold } } },
        {
          type: 'span',
          props: {
            style: { fontSize: 20, letterSpacing: 3, color: brand.muted, fontFamily: FONT_BODY },
            children: text,
          },
        },
      ],
    },
  };
}

function TitleLines({ props }: { props: TemplateProps }) {
  const size = props.template === 'cta' ? 84 : props.template === 'levels' ? 88 : 96;
  return {
    type: 'div',
    props: {
      style: { display: 'flex', flexDirection: 'column' as const },
      children: props.lines.map((line, index) => ({
        type: 'span',
        props: {
          style: {
            fontFamily: FONT_HEAD,
            fontWeight: 700,
            fontSize: size,
            lineHeight: 1.03,
            color: index === props.goldLine ? props.brand.gold : props.brand.text,
          },
          children: line,
        },
      })),
    },
  };
}

function LevelsRow({ brand, images }: { brand: BrandKit; images?: string[] | null }) {
  return {
    type: 'div',
    props: {
      style: { display: 'flex', gap: 14, marginTop: 8 },
      children: LEVELS.map((level, index) => {
        const image = images?.[index];
        return {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column' as const,
              justifyContent: 'flex-end',
              flex: 1,
              height: 420,
              border: `1px solid ${brand.gold}88`,
              borderRadius: 18,
              padding: 18,
              overflow: 'hidden' as const,
              position: 'relative' as const,
              background: '#0C1A26',
            },
            children: [
              ...(image
                ? [
                    {
                      type: 'img',
                      props: {
                        src: image,
                        width: 222,
                        height: 420,
                        style: {
                          position: 'absolute' as const,
                          top: 0,
                          left: 0,
                          width: 222,
                          height: 420,
                          objectFit: 'cover' as const,
                        },
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          position: 'absolute' as const,
                          top: 0,
                          left: 0,
                          width: 222,
                          height: 420,
                          background:
                            'linear-gradient(180deg, rgba(10,21,31,0.15) 0%, rgba(10,21,31,0.55) 55%, rgba(10,21,31,0.95) 100%)',
                        },
                      },
                    },
                  ]
                : []),
              {
                type: 'span',
                props: {
                  style: {
                    fontSize: 23,
                    color: brand.gold,
                    fontFamily: FONT_BODY,
                    fontWeight: 600,
                    position: 'relative' as const,
                  },
                  children: level,
                },
              },
              {
                type: 'span',
                props: {
                  style: {
                    fontSize: 15,
                    color: '#D8E0E8',
                    fontFamily: FONT_BODY,
                    position: 'relative' as const,
                  },
                  children: 'Nivel de participación',
                },
              },
            ],
          },
        };
      }),
    },
  };
}

function CtaPill({ brand, phone }: { brand: BrandKit; phone: string }) {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        marginTop: 22,
        border: `2px solid ${brand.gold}`,
        borderRadius: 999,
        padding: '18px 36px',
        width: 660,
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: 999,
              border: `2px solid ${brand.gold}`,
              color: brand.gold,
              fontSize: 18,
              fontFamily: FONT_BODY,
              letterSpacing: 1,
            },
            children: 'WA',
          },
        },
        {
          type: 'span',
          props: {
            style: { fontSize: 40, color: brand.text, fontFamily: FONT_BODY, fontWeight: 600 },
            children: phone,
          },
        },
      ],
    },
  };
}

/** Árbol completo de la pieza. */
export function buildTemplateElement(props: TemplateProps) {
  const { brand, template, width, height } = props;
  const hasImage = template === 'cover' && props.imageUrl;
  // `statement` y `cta` aceptan foto de fondo con un velo fuerte: sin imagen se
  // ven planas y pierden la calidad del resto.
  const hasBg = template !== 'cover' && props.backgroundImage;

  const stack: any[] = [];

  if (hasBg) {
    stack.push({
      type: 'img',
      props: {
        src: props.backgroundImage,
        width,
        height,
        style: { position: 'absolute' as const, top: 0, left: 0, width, height, objectFit: 'cover' as const },
      },
    });
    stack.push({
      type: 'div',
      props: {
        style: {
          position: 'absolute' as const,
          top: 0,
          left: 0,
          width,
          height,
          // Velo en diagonal con caída al centro: ilumina la foto en la zona del
          // titular y oscurece donde va el texto. Un velo uniforme la deja mate.
          background:
            'linear-gradient(155deg, rgba(10,21,31,0.88) 0%, rgba(10,21,31,0.62) 45%, rgba(10,21,31,0.94) 100%)',
        },
      },
    });
  }

  if (hasImage) {
    stack.push({
      type: 'img',
      props: {
        src: props.imageUrl,
        width,
        height,
        style: { position: 'absolute' as const, top: 0, left: 0, width, height, objectFit: 'cover' as const },
      },
    });
    stack.push({
      type: 'div',
      props: {
        style: {
          position: 'absolute' as const,
          top: 0,
          left: 0,
          width,
          height,
          background:
            'linear-gradient(180deg, rgba(10,21,31,0.94) 0%, rgba(10,21,31,0.55) 42%, rgba(10,21,31,0.96) 100%)',
        },
      },
    });
  }

  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: 76,
        background: brand.background,
        fontFamily: FONT_BODY,
        position: 'relative' as const,
      },
      children: [
        ...stack,
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column' as const,
              gap: 26,
              position: 'relative' as const,
              // En las piezas sin foto el contenido se centra: si no, queda un
              // hueco muerto enorme entre el titular y la firma.
              ...(template === 'cover' ? {} : { flex: 1, justifyContent: 'center' as const }),
            },
            children: [
              ...(props.kicker ? [Kicker({ text: props.kicker, brand })] : []),
              TitleLines({ props }),
              ...(props.body
                ? [
                    {
                      type: 'span',
                      props: {
                        style: {
                          fontSize: 28,
                          lineHeight: 1.5,
                          color: '#E9EEF3',
                          maxWidth: 780,
                          fontFamily: FONT_BODY,
                        },
                        children: props.body,
                      },
                    },
                  ]
                : []),
              ...(template === 'levels' ? [LevelsRow({ brand, images: props.cardImages })] : []),
              ...(template === 'cta' ? [CtaPill({ brand, phone: props.phone || '+1 833 652-9213' })] : []),
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              position: 'relative' as const,
            },
            children: [LogoRow({ brand })],
          },
        },
      ],
    },
  };
}
