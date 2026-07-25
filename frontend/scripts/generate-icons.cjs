// Generate PWA icons as base64 PNGs using pure Node.js (no canvas dependency)
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Gradient background
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#6366f1');
  gradient.addColorStop(1, '#8b5cf6');
  ctx.fillStyle = gradient;

  // Rounded rectangle
  const r = size * 0.2;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  // Text "DK"
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.4}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('DK', size / 2, size / 2);

  return canvas.toBuffer('image/png');
}

try {
  sizes.forEach(size => {
    const buffer = generateIcon(size);
    const filePath = path.join(iconsDir, `icon-${size}.png`);
    fs.writeFileSync(filePath, buffer);
    console.log(`✓ icon-${size}.png (${buffer.length} bytes)`);
  });
  console.log('\nAll icons generated in public/icons/');
} catch (err) {
  console.log('Canvas not available, creating SVG icons instead...');
  sizes.forEach(size => {
    const r = size * 0.2;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" style="stop-color:#6366f1"/><stop offset="100%" style="stop-color:#8b5cf6"/>
  </linearGradient></defs>
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#g)"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="sans-serif" font-weight="800" font-size="${size * 0.4}">DK</text>
</svg>`;
    fs.writeFileSync(path.join(iconsDir, `icon-${size}.svg`), svg);
    console.log(`Created icon-${size}.svg`);
  });
  console.log('\nInstall canvas: npm install canvas && node scripts/generate-icons.js');
}
