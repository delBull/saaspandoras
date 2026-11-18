/**
 * Mapa tipo de contenido → capability canónica.
 *
 * Módulo PURO (sin DB ni Next): testeable y reutilizable.
 * Los nombres históricos de API key (`Media.Image`, `Media.Copy`, …) siguen
 * siendo válidos como ALIAS vía `permissionSatisfied`; aquí solo se declara la
 * capability canónica que cada tipo de contenido requiere.
 */

export const CONTENT_TYPE_CAPABILITIES: Record<string, string> = {
  image: 'media.image.create',
  image_render: 'media.image.create',
  poster: 'media.image.create',
  video: 'media.video.create',
  video_render: 'media.video.create',
  reel: 'media.video.create',
  copy: 'media.copy.create',
  copy_render: 'media.copy.create',
  caption: 'media.copy.create',
  editorial: 'media.editorial.create',
  newsletter: 'media.editorial.create',
  audio: 'media.audio.create',
  podcast: 'media.audio.create',
  research: 'media.research.create',
  research_report: 'media.research.create',
};

/**
 * Resuelve la capability requerida para un tipo de contenido.
 * @returns el id canónico, o `null` si el tipo no está registrado (fail-closed).
 */
export function resolveContentCapability(type: string): string | null {
  const key = (type || '').trim().toLowerCase();
  return CONTENT_TYPE_CAPABILITIES[key] ?? null;
}
