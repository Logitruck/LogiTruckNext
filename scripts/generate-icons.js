const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const rootDir = path.join(__dirname, '..');
const input = path.join(rootDir, 'src', 'assets', 'icons', 'Icon-App.png');
const outputDir = path.join(rootDir, 'assets');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function run() {
  // icon.png -> fondo blanco, 1024x1024
  await sharp(input)
    .resize(700, 700, { fit: 'contain' })
    .extend({
      top: 162,
      bottom: 162,
      left: 162,
      right: 162,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .resize(1024, 1024)
    .png()
    .toFile(path.join(outputDir, 'icon.png'));

  // android foreground -> transparente
  await sharp(input)
    .resize(700, 700, { fit: 'contain' })
    .extend({
      top: 162,
      bottom: 162,
      left: 162,
      right: 162,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .resize(1024, 1024)
    .png()
    .toFile(path.join(outputDir, 'android-icon-foreground.png'));

  // android monochrome -> por ahora igual al foreground
  await sharp(input)
    .resize(700, 700, { fit: 'contain' })
    .extend({
      top: 162,
      bottom: 162,
      left: 162,
      right: 162,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .resize(1024, 1024)
    .png()
    .toFile(path.join(outputDir, 'android-icon-monochrome.png'));

      // favicon -> 48x48 (web)
  await sharp(input)
    .resize(48, 48)
    .png()
    .toFile(path.join(outputDir, 'favicon.png'));

      // SPLASH SCREEN (logo centrado con padding)
  await sharp(input)
    .resize(500, 500, { fit: 'contain' }) // más pequeño para que no se vea gigante
    .extend({
      top: 350,
      bottom: 350,
      left: 350,
      right: 350,
      background: { r: 0, g: 0, b: 0, alpha: 0 }, // transparente
    })
    .resize(1024, 1024)
    .png()
    .toFile(path.join(outputDir, 'splash-icon.png'));

  console.log('✅ Icons generados en /assets');
}

run().catch(error => {
  console.error('❌ Error generando icons:', error);
  process.exit(1);
});