// ===========================================================================
// Sincroniza configuracao SEO do Supabase para os HTMLs estaticos do site.
//
// Le a tabela `seo_pages` e atualiza cada HTML correspondente, substituindo
// o bloco delimitado por <!-- SEO:start --> ... <!-- SEO:end -->.
//
// Execucao:
//   SUPABASE_URL=...  SUPABASE_SERVICE_ROLE_KEY=...  node scripts/sync-seo.mjs
//
// Acionado automaticamente via .github/workflows/sync-seo.yml.
// ===========================================================================

import { createClient } from '@supabase/supabase-js';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars');
    process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = resolve(__dirname, '..');

const SLUG_TO_FILE = {
    '/':                'index.html',
    '/adotar':          'adotar.html',
    '/apadrinhar':      'apadrinhar.html',
    '/quem-somos':      'quem-somos.html',
    '/eventos':         'eventos.html',
    '/ser-voluntario':  'ser-voluntario.html',
    '/faq':             'faq.html',
    '/denunciar':       'denunciar.html',
    '/transparencia':   'transparencia.html',
};

const SEO_MARKER_START = '<!-- SEO:start (gerado automaticamente, nao edite a mao) -->';
const SEO_MARKER_END = '<!-- SEO:end -->';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
});

function htmlAttr(s) {
    if (s == null) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function buildSeoBlock(page) {
    const lines = [SEO_MARKER_START];
    if (page.title) lines.push(`    <title>${htmlAttr(page.title)}</title>`);
    if (page.meta_description) lines.push(`    <meta name="description" content="${htmlAttr(page.meta_description)}" />`);
    if (page.canonical_url) lines.push(`    <link rel="canonical" href="${htmlAttr(page.canonical_url)}" />`);
    if (page.robots) lines.push(`    <meta name="robots" content="${htmlAttr(page.robots)}" />`);
    if (page.keywords && page.keywords.length > 0) {
        lines.push(`    <meta name="keywords" content="${htmlAttr(page.keywords.join(', '))}" />`);
    }
    const ogTitle = page.og_title || page.title;
    const ogDesc = page.og_description || page.meta_description;
    if (ogTitle) lines.push(`    <meta property="og:title" content="${htmlAttr(ogTitle)}" />`);
    if (ogDesc) lines.push(`    <meta property="og:description" content="${htmlAttr(ogDesc)}" />`);
    if (page.og_image_url) lines.push(`    <meta property="og:image" content="${htmlAttr(page.og_image_url)}" />`);
    if (page.canonical_url) lines.push(`    <meta property="og:url" content="${htmlAttr(page.canonical_url)}" />`);
    lines.push(`    <meta property="og:type" content="website" />`);
    const twTitle = page.twitter_title || ogTitle;
    const twDesc = page.twitter_description || ogDesc;
    const twImage = page.twitter_image_url || page.og_image_url;
    lines.push(`    <meta name="twitter:card" content="${twImage ? 'summary_large_image' : 'summary'}" />`);
    if (twTitle) lines.push(`    <meta name="twitter:title" content="${htmlAttr(twTitle)}" />`);
    if (twDesc) lines.push(`    <meta name="twitter:description" content="${htmlAttr(twDesc)}" />`);
    if (twImage) lines.push(`    <meta name="twitter:image" content="${htmlAttr(twImage)}" />`);
    lines.push(SEO_MARKER_END);
    return lines.join('\n');
}

function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripOldSeoTags(html) {
    const patterns = [
        /\s*<title>[^<]*<\/title>/i,
        /\s*<meta\s+name="description"[^>]*\/?>/gi,
        /\s*<meta\s+name="keywords"[^>]*\/?>/gi,
        /\s*<meta\s+name="robots"[^>]*\/?>/gi,
        /\s*<link\s+rel="canonical"[^>]*\/?>/gi,
        /\s*<meta\s+property="og:[^"]+"[^>]*\/?>/gi,
        /\s*<meta\s+name="twitter:[^"]+"[^>]*\/?>/gi,
    ];
    let out = html;
    for (const p of patterns) out = out.replace(p, '');
    return out;
}

async function applyToFile(filePath, page) {
    const before = await readFile(filePath, 'utf8');
    const seoBlock = buildSeoBlock(page);
    const markerRegex = new RegExp(
        `${escapeRegex(SEO_MARKER_START)}[\\s\\S]*?${escapeRegex(SEO_MARKER_END)}`,
        'm'
    );
    let after;
    if (markerRegex.test(before)) {
        after = before.replace(markerRegex, seoBlock);
    } else {
        after = stripOldSeoTags(before).replace(/<head([^>]*)>/i, (m) => `${m}\n    ${seoBlock}`);
    }
    const changed = after !== before;
    if (changed) await writeFile(filePath, after, 'utf8');
    return changed;
}

async function main() {
    console.log(`Reading SEO config from Supabase...`);
    const { data: pages, error } = await supabase.from('seo_pages').select('*');
    if (error) throw error;
    console.log(`Found ${pages.length} pages.\n`);

    let okCount = 0;
    let skipCount = 0;
    let changedCount = 0;
    const errors = [];

    for (const page of pages) {
        const filename = SLUG_TO_FILE[page.slug];
        if (!filename) {
            console.warn(`[skip] ${page.slug} — sem mapeamento`);
            skipCount++;
            continue;
        }
        const filePath = resolve(SITE_ROOT, filename);
        if (!existsSync(filePath)) {
            console.warn(`[skip] ${page.slug} — arquivo nao existe: ${filePath}`);
            skipCount++;
            continue;
        }
        try {
            const changed = await applyToFile(filePath, page);
            if (changed) {
                console.log(`[chg]  ${page.slug.padEnd(20)} -> ${filename}`);
                changedCount++;
            } else {
                console.log(`[=]    ${page.slug.padEnd(20)} -> ${filename} (sem mudancas)`);
            }
            okCount++;
        } catch (err) {
            console.error(`[err]  ${page.slug}: ${err.message}`);
            errors.push({ slug: page.slug, error: err.message });
        }
    }

    console.log(`\n========== RESUMO ==========`);
    console.log(`OK:       ${okCount}`);
    console.log(`Mudados:  ${changedCount}`);
    console.log(`Pulados:  ${skipCount}`);
    console.log(`Erros:    ${errors.length}`);
    if (errors.length > 0) process.exit(1);
}

main().catch((err) => {
    console.error('Fatal:', err);
    process.exit(1);
});
