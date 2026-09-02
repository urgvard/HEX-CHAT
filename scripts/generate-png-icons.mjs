// Simple PNG generator with pure Node.js (no external deps)
import fs from 'fs';
import zlib from 'zlib';

function createPNG(width, height, r, g, b, a = 255) {
  // A minimal valid uncompressed/deflated raw RGBA PNG generator
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: RGBA (6)
  ihdrData[10] = 0; // Compression: Deflate
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace: none

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image scanlines
  // Each line starts with a filter byte (0) followed by RGBA pixels
  const rowLength = 1 + width * 4;
  const rawData = Buffer.alloc(rowLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // filter None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      
      // Draw background gradient & central community icon
      const cx = width / 2;
      const cy = height / 2;
      const distFromCenter = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const isInnerCircle = distFromCenter < width * 0.25;
      const isRing = distFromCenter >= width * 0.32 && distFromCenter <= width * 0.42 && y > cy;

      if (isInnerCircle || isRing) {
        rawData[pxOffset] = 56;    // R (sky blue)
        rawData[pxOffset + 1] = 189; // G
        rawData[pxOffset + 2] = 248; // B
        rawData[pxOffset + 3] = 255; // A
      } else {
        // Gradient background
        const gradRatio = (x + y) / (width + height);
        rawData[pxOffset] = Math.round(30 * (1 - gradRatio) + 15 * gradRatio); // 30 -> 15
        rawData[pxOffset + 1] = Math.round(58 * (1 - gradRatio) + 23 * gradRatio); // 58 -> 23
        rawData[pxOffset + 2] = Math.round(138 * (1 - gradRatio) + 42 * gradRatio); // 138 -> 42
        rawData[pxOffset + 3] = 255;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const buffer = Buffer.alloc(8 + length + 4);
  buffer.writeUInt32BE(length, 0);
  buffer.write(type, 4, 4, 'ascii');
  data.copy(buffer, 8);

  const crc = crc32(buffer.subarray(4, 8 + length));
  buffer.writeUInt32BE(crc, 8 + length);
  return buffer;
}

// CRC32 implementation
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i];
    crc = crc ^ byte;
    for (let j = 0; j < 8; j++) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const p192 = createPNG(192, 192, 30, 58, 138);
const p512 = createPNG(512, 512, 30, 58, 138);
const appleIcon = createPNG(180, 180, 30, 58, 138);

fs.writeFileSync('public/pwa-192x192.png', p192);
fs.writeFileSync('public/pwa-512x512.png', p512);
fs.writeFileSync('public/pwa-maskable-512x512.png', p512);
fs.writeFileSync('public/apple-touch-icon.png', appleIcon);
console.log('PWA PNG Icons successfully generated in public/ directory.');
