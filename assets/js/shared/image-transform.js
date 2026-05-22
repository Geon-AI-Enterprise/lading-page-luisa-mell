// ========================================
// Image Transform - Supabase Storage
// Converte URLs do Storage para o endpoint de
// transformação, reduzindo tamanho das imagens
// automaticamente via Supabase Image Resizing.
// ========================================

const OBJECT_SEGMENT  = '/storage/v1/object/public/';
const RENDER_SEGMENT  = '/storage/v1/render/image/public/';

/**
 * Transforma uma URL do Supabase Storage para o endpoint de resize.
 *
 * @param {string|null|undefined} url   - URL original do Storage
 * @param {object} opts
 * @param {number} [opts.width]         - Largura máxima em px
 * @param {number} [opts.height]        - Altura máxima em px
 * @param {number} [opts.quality=80]    - Qualidade JPEG/WebP (1-100)
 * @param {'cover'|'contain'|'fill'} [opts.resize='cover'] - Modo de resize
 * @returns {string|null} URL transformada ou null se a entrada for inválida
 */
export function transformImageUrl(url, { width, height, quality = 80, resize = 'cover' } = {}) {
    if (!url || typeof url !== 'string') return null;
    // Image Transformations não está habilitado no projeto (requer plano Pro).
    // Retornamos a URL original do Storage até o recurso ser ativado.
    return url;
}

// ── Presets prontos para uso ──────────────────────────────────────────────────

/** Thumbnail para cards de adoção/apadrinhamento (~360 px) */
export const cardThumb   = (url) => transformImageUrl(url, { width: 360, quality: 75 });

/** Imagem principal do modal (~720 px) */
export const modalMain   = (url) => transformImageUrl(url, { width: 720, quality: 85 });

/** Itens da galeria do modal (~600 px) */
export const modalGallery = (url) => transformImageUrl(url, { width: 600, quality: 82 });

/** Antes/Depois no modal (~480 px) */
export const modalBeforeAfter = (url) => transformImageUrl(url, { width: 480, quality: 82 });

/** Avatar minúsculo para tabelas de admin (~96 px) */
export const avatarThumb = (url) => transformImageUrl(url, { width: 96,  quality: 75 });
