const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="flame" x1="256" y1="64" x2="256" y2="352" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="55%" stop-color="#f97316"/>
      <stop offset="100%" stop-color="#ef4444"/>
    </linearGradient>
  </defs>

  <!-- rounded-square background -->
  <rect width="512" height="512" rx="128" fill="#1a1a1a"/>

  <!-- anvil body -->
  <path d="M176 224h160l-24 104h-112l-24-104Z" fill="#faf9f7"/>

  <!-- anvil base -->
  <path d="M128 360c0-17.6 14.4-32 32-32h192c17.6 0 32 14.4 32 32v24c0 17.6-14.4 32-32 32H160c-17.6 0-32-14.4-32-32v-24Z" fill="#faf9f7"/>

  <!-- flame -->
  <path d="M256 80c-32 64-72 104-72 160 0 44 32 76 72 76s72-32 72-76c0-56-40-96-72-160Z" fill="url(#flame)"/>
</svg>`;

async function generate() {
  const svgBuffer = Buffer.from(svg);

  // Save SVG favicon
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgBuffer);

  // Generate PNGs
  const sizes = [180, 192, 512];
  for (const size of sizes) {
    const filename = size === 180 ? 'apple-touch-icon.png' : `icon-${size}x${size}.png`;
    await sharp(svgBuffer)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, filename));
    console.log(`Generated ${filename}`);
  }

  // Generate multi-resolution ICO (16, 32, 48)
  const icoSizes = [16, 32, 48];
  const pngBuffers = await Promise.all(
    icoSizes.map((size) =>
      sharp(svgBuffer)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()
    )
  );

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(icoSizes.length, 4); // count

  const directorySize = icoSizes.length * 16;
  const dataOffset = header.length + directorySize;

  let currentOffset = dataOffset;
  const directory = Buffer.alloc(directorySize);
  const dataParts = [];

  for (let i = 0; i < icoSizes.length; i++) {
    const size = icoSizes[i];
    const png = pngBuffers[i];
    const entryOffset = i * 16;

    directory.writeUInt8(size === 256 ? 0 : size, entryOffset + 0); // width
    directory.writeUInt8(size === 256 ? 0 : size, entryOffset + 1); // height
    directory.writeUInt8(0, entryOffset + 2); // colors
    directory.writeUInt8(0, entryOffset + 3); // reserved
    directory.writeUInt16LE(1, entryOffset + 4); // color planes
    directory.writeUInt16LE(32, entryOffset + 6); // bits per pixel
    directory.writeUInt32LE(png.length, entryOffset + 8); // size
    directory.writeUInt32LE(currentOffset, entryOffset + 12); // offset

    dataParts.push(png);
    currentOffset += png.length;
  }

  const icoBuffer = Buffer.concat([header, directory, ...dataParts]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  console.log('Generated favicon.ico');
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
