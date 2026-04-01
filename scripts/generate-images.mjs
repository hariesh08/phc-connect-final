/**
 * Generate OG preview image and favicon PNGs from SVG sources.
 * Uses sharp (if available) or falls back to a simple copy approach.
 * For production, we'll use the SVG directly and also create a PNG via canvas.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createCanvas, loadImage } from '@napi-rs/canvas';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

async function generateOgImage() {
  const canvas = createCanvas(1200, 630);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 1200, 630);
  bgGrad.addColorStop(0, '#0D47A1');
  bgGrad.addColorStop(0.5, '#1565C0');
  bgGrad.addColorStop(1, '#1E88E5');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1200, 630);

  // Subtle grid
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= 1200; x += 60) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 630); ctx.stroke();
  }
  for (let y = 0; y <= 630; y += 60) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1200, y); ctx.stroke();
  }

  // Heartbeat line
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 400); ctx.lineTo(200, 400); ctx.lineTo(230, 340); ctx.lineTo(260, 460);
  ctx.lineTo(290, 380); ctx.lineTo(320, 420); ctx.lineTo(350, 400); ctx.lineTo(600, 400);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.moveTo(600, 400); ctx.lineTo(850, 400); ctx.lineTo(880, 340); ctx.lineTo(910, 460);
  ctx.lineTo(940, 380); ctx.lineTo(970, 420); ctx.lineTo(1000, 400); ctx.lineTo(1200, 400);
  ctx.stroke();

  // Decorative circles
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.beginPath(); ctx.arc(100, 100, 80, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(1100, 530, 120, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.beginPath(); ctx.arc(1050, 100, 60, 0, Math.PI * 2); ctx.fill();

  // Hospital cross icons
  const drawCross = (cx, cy, size, opacity) => {
    ctx.fillStyle = `rgba(255,255,255,${opacity})`;
    const w = size * 0.3, h = size;
    ctx.beginPath();
    ctx.roundRect(cx - w/2, cy - h/2, w, h, 4);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(cx - h/2, cy - w/2, h, w, 4);
    ctx.fill();
  };
  drawCross(80, 80, 80, 0.1);
  drawCross(1100, 500, 64, 0.08);

  // Shield icon
  ctx.save();
  ctx.translate(600, 210);
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -65);
  ctx.bezierCurveTo(35, -65, 60, -50, 60, -20);
  ctx.bezierCurveTo(60, 25, 35, 55, 0, 70);
  ctx.bezierCurveTo(-35, 55, -60, 25, -60, -20);
  ctx.bezierCurveTo(-60, -50, -35, -65, 0, -65);
  ctx.fill();
  ctx.stroke();
  // Cross inside shield
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath(); ctx.roundRect(-8, -30, 16, 55, 3); ctx.fill();
  ctx.beginPath(); ctx.roundRect(-25, -12, 50, 16, 3); ctx.fill();
  ctx.restore();

  // Wave decorations at bottom
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.beginPath();
  ctx.moveTo(0, 560);
  ctx.bezierCurveTo(200, 520, 400, 580, 600, 550);
  ctx.bezierCurveTo(800, 520, 1000, 570, 1200, 540);
  ctx.lineTo(1200, 630); ctx.lineTo(0, 630);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.beginPath();
  ctx.moveTo(0, 580);
  ctx.bezierCurveTo(200, 550, 400, 600, 600, 570);
  ctx.bezierCurveTo(800, 540, 1000, 590, 1200, 560);
  ctx.lineTo(1200, 630); ctx.lineTo(0, 630);
  ctx.fill();

  // Title
  ctx.fillStyle = 'white';
  ctx.font = '800 72px "Segoe UI", Arial, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '2px';
  ctx.fillText('PHC Connect', 600, 330);

  // Separator
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath(); ctx.roundRect(480, 350, 240, 3, 2); ctx.fill();

  // Subtitle
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '400 28px "Segoe UI", Arial, Helvetica, sans-serif';
  ctx.letterSpacing = '4px';
  ctx.fillText('Smart Healthcare Monitoring System', 600, 400);

  // Tagline
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '300 18px "Segoe UI", Arial, Helvetica, sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('Attendance  •  Medicine Stock  •  Infrastructure  •  Service Quality', 600, 450);

  // Bottom bar
  ctx.fillStyle = 'rgba(13,71,161,0.5)';
  ctx.fillRect(0, 610, 1200, 20);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '400 13px "Segoe UI", Arial, Helvetica, sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText('phc-connect.vercel.app', 600, 624);

  const buffer = canvas.toBuffer('image/png');
  writeFileSync(join(publicDir, 'og-image.png'), buffer);
  console.log('✅ Generated og-image.png (1200x630)');
}

async function generateFavicons() {
  const sizes = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'android-chrome-192x192.png', size: 192 },
    { name: 'android-chrome-512x512.png', size: 512 },
  ];

  for (const { name, size } of sizes) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Rounded rect background
    const radius = size * 0.1875; // ~96/512
    const bgGrad = ctx.createLinearGradient(0, 0, size, size);
    bgGrad.addColorStop(0, '#0D47A1');
    bgGrad.addColorStop(1, '#1E88E5');
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, radius);
    ctx.fill();

    // Hospital cross
    ctx.fillStyle = 'white';
    const crossW = size * 0.195; // ~100/512
    const crossH = size * 0.547; // ~280/512
    const crossR = size * 0.031; // ~16/512
    const cx = size / 2, cy = size / 2;
    ctx.beginPath();
    ctx.roundRect(cx - crossW/2, cy - crossH/2, crossW, crossH, crossR);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(cx - crossH/2, cy - crossW/2, crossH, crossW, crossR);
    ctx.fill();

    // Signal dots (only for larger sizes)
    if (size >= 64) {
      const dotPositions = [
        { x: size * 0.78, y: size * 0.78, r: size * 0.023, o: 0.4 },
        { x: size * 0.84, y: size * 0.72, r: size * 0.016, o: 0.3 },
        { x: size * 0.72, y: size * 0.84, r: size * 0.012, o: 0.2 },
      ];
      for (const dot of dotPositions) {
        ctx.fillStyle = `rgba(255,255,255,${dot.o})`;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const buffer = canvas.toBuffer('image/png');
    writeFileSync(join(publicDir, name), buffer);
    console.log(`✅ Generated ${name} (${size}x${size})`);
  }
}

async function main() {
  try {
    await generateOgImage();
    await generateFavicons();
    console.log('\n🎉 All images generated successfully!');
  } catch (err) {
    console.error('Error generating images:', err);
    process.exit(1);
  }
}

main();
