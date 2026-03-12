// SmartQuote-AI/scripts/generate-icons.ts
import fs from 'fs';
import path from 'path';

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const MASKABLE_SIZES = [192, 512];
const ICONS_DIR = path.join(process.cwd(), 'public', 'icons');

function generateSVG(size: number, maskable = false): string {
    const padding = maskable ? Math.round(size * 0.1) : 0;
    const inner = size - padding * 2;
    const cx = size / 2;
    const cy = size / 2;
    const bgRadius = maskable ? 0 : Math.round(size * 0.18);
    const fontSize = Math.round(inner * 0.28);
    const subFontSize = Math.round(inner * 0.09);

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a"/>
      <stop offset="100%" style="stop-color:#1e293b"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#06b6d4"/>
      <stop offset="100%" style="stop-color:#3b82f6"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${bgRadius}" fill="url(#bg)"/>
  <circle cx="${cx}" cy="${cy - inner * 0.02}" r="${inner * 0.32}" fill="none" stroke="url(#accent)" stroke-width="${Math.max(2, Math.round(size * 0.025))}"/>
  <text x="${cx}" y="${cy + fontSize * 0.15}" font-family="system-ui,-apple-system,sans-serif" font-weight="800" font-size="${fontSize}" fill="url(#accent)" text-anchor="middle">SQ</text>
  <text x="${cx}" y="${cy + inner * 0.28}" font-family="system-ui,-apple-system,sans-serif" font-weight="600" font-size="${subFontSize}" fill="#94a3b8" text-anchor="middle">AI</text>
</svg>`;
}

if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
}

SIZES.forEach((size) => {
    const svg = generateSVG(size, false);
    const filePath = path.join(ICONS_DIR, `icon-${size}x${size}.svg`);
    fs.writeFileSync(filePath, svg);
    console.log(`✅ ${filePath}`);
});

MASKABLE_SIZES.forEach((size) => {
    const svg = generateSVG(size, true);
    const filePath = path.join(ICONS_DIR, `icon-maskable-${size}x${size}.svg`);
    fs.writeFileSync(filePath, svg);
    console.log(`✅ ${filePath} (maskable)`);
});

const favicon = generateSVG(32, false);
fs.writeFileSync(path.join(process.cwd(), 'public', 'favicon.svg'), favicon);
console.log('✅ public/favicon.svg');

console.log('\n🎨 Ikony SVG wygenerowane.');
console.log('💡 Dla produkcji skonwertuj SVG → PNG: npx sharp-cli lub https://svgtopng.com');