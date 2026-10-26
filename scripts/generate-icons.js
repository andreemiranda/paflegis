const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const publicDir = path.join(process.cwd(), 'public');

const svgIcon = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e3a8a" />
      <stop offset="100%" stop-color="#0369a1" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.3" />
    </filter>
  </defs>

  <!-- Fundo Circular com Borda -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />
  <rect x="12" y="12" width="488" height="488" rx="100" stroke="#38bdf8" stroke-opacity="0.3" stroke-width="6" fill="none" />

  <!-- Emblema Cívico / Casa Legislativa -->
  <g filter="url(#shadow)" transform="translate(56, 60)">
    <!-- Cúpula / Frontão do Parlamento -->
    <path d="M200 40 L40 130 L360 130 Z" fill="url(#goldGrad)" />
    
    <!-- Entablamento -->
    <rect x="30" y="130" width="340" height="24" rx="4" fill="#ffffff" />
    
    <!-- Colunas Clássicas (4 colunas) -->
    <rect x="55" y="166" width="36" height="130" rx="6" fill="#e2e8f0" />
    <rect x="135" y="166" width="36" height="130" rx="6" fill="#e2e8f0" />
    <rect x="215" y="166" width="36" height="130" rx="6" fill="#e2e8f0" />
    <rect x="295" y="166" width="36" height="130" rx="6" fill="#e2e8f0" />
    
    <!-- Capitéis e Bases -->
    <rect x="47" y="154" width="52" height="14" rx="3" fill="#ffffff" />
    <rect x="127" y="154" width="52" height="14" rx="3" fill="#ffffff" />
    <rect x="207" y="154" width="52" height="14" rx="3" fill="#ffffff" />
    <rect x="287" y="154" width="52" height="14" rx="3" fill="#ffffff" />

    <rect x="47" y="294" width="52" height="14" rx="3" fill="#ffffff" />
    <rect x="127" y="294" width="52" height="14" rx="3" fill="#ffffff" />
    <rect x="207" y="294" width="52" height="14" rx="3" fill="#ffffff" />
    <rect x="287" y="294" width="52" height="14" rx="3" fill="#ffffff" />

    <!-- Estilóbato / Base em degraus -->
    <rect x="20" y="308" width="360" height="20" rx="4" fill="#ffffff" />
    <rect x="6" y="328" width="388" height="24" rx="6" fill="url(#goldGrad)" />

    <!-- Estrela Central no Frontão -->
    <polygon points="200,68 206,86 224,86 210,96 215,114 200,103 185,114 190,96 176,86 194,86" fill="#ffffff" />
  </g>
</svg>
`;

async function generate() {
  const svgBuffer = Buffer.from(svgIcon);

  const targets = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'favicon-48x48.png', size: 48 },
    { name: 'favicon.png', size: 64 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'icon-192x192.png', size: 192 },
    { name: 'icon-512x512.png', size: 512 },
    { name: 'og-image.png', width: 1200, height: 630 },
  ];

  for (const t of targets) {
    const dest = path.join(publicDir, t.name);
    if (t.width && t.height) {
      await sharp(svgBuffer)
        .resize(t.width, t.height, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 1 } })
        .png()
        .toFile(dest);
    } else {
      await sharp(svgBuffer)
        .resize(t.size, t.size)
        .png()
        .toFile(dest);
    }
    console.log(`Generated: ${t.name}`);
  }

  // Generate favicon.ico from 32x32 PNG buffer
  const ico32 = await sharp(svgBuffer).resize(32, 32).toFormat('png').toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), ico32);
  console.log('Generated: favicon.ico');
}

generate().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
