// Run this script to generate PWA icons: node scripts/generate-icons.js
// Requires: npm install canvas (optional, falls back to placeholder SVGs)

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

let Canvas;
try {
  Canvas = require('canvas');
} catch {
  console.log('canvas package not found. Generating SVG placeholders instead.');
}

function generateSVG(size) {
  const r = size * 0.2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1"/>
      <stop offset="100%" style="stop-color:#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#g)"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Inter,sans-serif" font-weight="800" font-size="${size * 0.4}">DK</text>
</svg>`;
}

if (Canvas) {
  const { createCanvas } = Canvas;
  sizes.forEach(size => {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#6366f1');
    gradient.addColorStop(1, '#8b5cf6');
    ctx.fillStyle = gradient;

    // Rounded rect
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

    // Text
    ctx.fillStyle = 'white';
    ctx.font = `bold ${size * 0.4}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DK', size / 2, size / 2);

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(iconsDir, `icon-${size}.png`), buffer);
    console.log(`Generated icon-${size}.png`);
  });
} else {
  // Generate SVG placeholders
  sizes.forEach(size => {
    const svg = generateSVG(size);
    fs.writeFileSync(path.join(iconsDir, `icon-${size}.svg`), svg);
    console.log(`Generated icon-${size}.svg (SVG placeholder)`);
  });
  console.log('\nTo generate proper PNG icons, run: npm install canvas');
  console.log('Then re-run this script.');
}

console.log('\nDone! Icons generated in public/icons/');
