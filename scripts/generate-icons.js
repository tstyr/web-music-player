// PWAアイコン生成スクリプト
const fs = require('fs');
const path = require('path');

// SVGアイコンのテンプレート
const createSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1db954;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#1ed760;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1aa34a;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- 背景 -->
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
  
  <!-- 音符アイコン -->
  <g transform="translate(${size * 0.3}, ${size * 0.2})">
    <!-- 音符の棒 -->
    <rect x="${size * 0.15}" y="0" width="${size * 0.08}" height="${size * 0.5}" fill="white" rx="${size * 0.02}"/>
    
    <!-- 音符の丸 -->
    <ellipse cx="${size * 0.19}" cy="${size * 0.52}" rx="${size * 0.12}" ry="${size * 0.09}" fill="white"/>
    
    <!-- 音符の旗 -->
    <path d="M ${size * 0.23} ${size * 0.05} Q ${size * 0.35} ${size * 0.08}, ${size * 0.35} ${size * 0.18} L ${size * 0.23} ${size * 0.25} Z" fill="white"/>
  </g>
</svg>
`;

// publicディレクトリのパス
const publicDir = path.join(__dirname, '..', 'public');

// SVGファイルを生成
const sizes = [192, 512];

sizes.forEach(size => {
  const svg = createSVG(size);
  const filename = `icon-${size}.svg`;
  const filepath = path.join(publicDir, filename);
  
  fs.writeFileSync(filepath, svg.trim());
  console.log(`✓ Generated ${filename}`);
});

console.log('\n✓ All icons generated successfully!');
console.log('\nNote: SVG icons are being used. For PNG icons, you can:');
console.log('1. Open the SVG files in a browser');
console.log('2. Use an online converter (e.g., cloudconvert.com)');
console.log('3. Or install sharp: npm install sharp');
