/**
 * build.js
 * 
 * Main build script that:
 * 1. Copies the SVG zip from input directory
 * 2. Runs the build-icon-font.js script
 * 3. Generates a timestamp and version info
 */

const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const { exec } = require('child_process');

async function build() {
  try {
    console.log('Starting icon font build process...');
    
    // Copy svg.zip to root directory
    console.log('Copying svg.zip to root directory...');
    await fs.copy(path.join(__dirname, '..', 'input', 'svg.zip'), path.join(__dirname, '..', 'svg.zip'), { overwrite: true });
    
    // Run the icon font builder and wait for it to complete
    console.log('Running build-icon-font.js...');
    const buildResult = await execScript('build-icon-font.js');
    if (!buildResult) {
      throw new Error('Icon font build failed');
    }
    
    // Verify that font files exist before continuing
    console.log('Verifying font files were generated...');
    const fontsDir = path.join(__dirname, '..', 'Fonts');
    const files = await fs.readdir(fontsDir);
    const fontFiles = files.filter(f => 
      f.endsWith('.ttf') || f.endsWith('.woff') || f.endsWith('.woff2')
    );
    
    if (fontFiles.length === 0) {
      throw new Error('No font files were generated! Stopping build process.');
    }
    
    console.log(`Found ${fontFiles.length} font files. Continuing with build...`);
    
    // Generate documentation with error handling
    try {
      await generateDocumentation();
    } catch (error) {
      console.error('Error generating documentation:', error);
      console.log('Continuing with build process...');
    }
    
    // Generate demo HTML
    console.log('Generating demo HTML...');
    await execScript('scripts/generate-demo.js');
    
    // Count the number of generated icons
    const iconCount = await countIcons();
    
    // Save build info
    await saveBuildInfo(iconCount);
    
    console.log('\nBuild completed successfully!');
    console.log(`Generated ${iconCount} icons`);
    console.log('Check the "Fonts" directory for output files.');
    
    // Create test HTML files
    await createTestHtml();
    await createInlineTestHtml();
    await createSvgTestHtml();
    await createSingleIconTestHtml();
    
    await createDemoHtml();
    
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

async function countIcons() {
  try {
    const fontsDir = path.join(__dirname, '..', 'Fonts');
    const files = await fs.readdir(fontsDir);
    
    // Look for JSON mapping files (excluding build-info.json)
    const jsonFiles = files.filter(f => f.endsWith('.json') && f !== 'build-info.json');
    
    let totalIcons = 0;
    
    for (const jsonFile of jsonFiles) {
      const filePath = path.join(fontsDir, jsonFile);
      if (await fs.pathExists(filePath)) {
        const mapping = await fs.readJson(filePath);
        totalIcons += Object.keys(mapping).length;
      }
    }
    
    return totalIcons;
  } catch (error) {
    console.error('Error counting icons:', error);
    return 0;
  }
}

// Add this function to create a simple test HTML
async function createTestHtml() {
  const testHtmlPath = path.join(__dirname, '..', 'Fonts', 'test.html');
  const content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Icon Font Test</title>
  <style>
    /* Critical CSS to prevent layout shifts */
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      margin: 0;
      padding: 0;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    .page-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    /* Hide content until fonts are loaded */
    .fonts-loaded body {
      opacity: 1;
    }
  </style>
  <link rel="stylesheet" href="saxi-icons-all.css">
  <script>
    // Font loading detection
    document.fonts.ready.then(() => {
      document.documentElement.classList.add('fonts-loaded');
    });
  </script>
  <style>
    .icon-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .icon-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      border-radius: 8px;
      background-color: #f5f5f5;
      text-align: center;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .icon {
      font-size: 32px;
      margin-bottom: 10px;
      display: inline-block;
      height: 32px;
      width: 32px;
      line-height: 1;
    }
    h2 {
      margin-top: 40px;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }
    
    .font-error-message {
      display: none;
      padding: 15px;
      background-color: #fff3cd;
      color: #856404;
      border: 1px solid #ffeeba;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    
    /* Ensure all icons have normal font-style */
    [class^="saxi-"], [class*=" saxi-"] {
      font-style: normal !important;
    }
  </style>
</head>
<body>
  <div class="page-container">
    <h1>Icon Font Test</h1>
    
    <div id="font-error" class="font-error-message">
      Some icon fonts may not be loading correctly. Please ensure the font files are properly generated.
    </div>
    
    <h2>Bold Style (saxi-solid)</h2>
    <div class="icon-grid">
      <div class="icon-card">
        <i class="saxi-solid saxi-24-support icon"></i>
        <div>24-support</div>
      </div>
      <div class="icon-card">
        <i class="saxi-solid saxi-3d-cube-scan icon"></i>
        <div>3d-cube-scan</div>
      </div>
      <div class="icon-card">
        <i class="saxi-solid saxi-3d-rotate icon"></i>
        <div>3d-rotate</div>
      </div>
    </div>
    
    <h2>Linear Style (saxi-regular)</h2>
    <div class="icon-grid">
      <div class="icon-card">
        <i class="saxi-regular saxi-24-support icon"></i>
        <div>24-support</div>
      </div>
      <div class="icon-card">
        <i class="saxi-regular saxi-3d-cube-scan icon"></i>
        <div>3d-cube-scan</div>
      </div>
      <div class="icon-card">
        <i class="saxi-regular saxi-3d-rotate icon"></i>
        <div>3d-rotate</div>
      </div>
    </div>
    
    <h2>Outline Style (saxi-light)</h2>
    <div class="icon-grid">
      <div class="icon-card">
        <i class="saxi-light saxi-24-support icon"></i>
        <div>24-support</div>
      </div>
      <div class="icon-card">
        <i class="saxi-light saxi-3d-cube-scan icon"></i>
        <div>3d-cube-scan</div>
      </div>
      <div class="icon-card">
        <i class="saxi-light saxi-3d-rotate icon"></i>
        <div>3d-rotate</div>
      </div>
    </div>
    
    <h2>Broken Style (saxi-broken)</h2>
    <div class="icon-grid">
      <div class="icon-card">
        <i class="saxi-broken saxi-24-support icon"></i>
        <div>24-support</div>
      </div>
      <div class="icon-card">
        <i class="saxi-broken saxi-3d-cube-scan icon"></i>
        <div>3d-cube-scan</div>
      </div>
      <div class="icon-card">
        <i class="saxi-broken saxi-3d-rotate icon"></i>
        <div>3d-rotate</div>
      </div>
    </div>
    
    <h2>TwoTone Style (saxi-twotone)</h2>
    <div class="icon-grid">
      <div class="icon-card">
        <i class="saxi-twotone saxi-24-support icon"></i>
        <div>24-support</div>
      </div>
      <div class="icon-card">
        <i class="saxi-twotone saxi-3d-cube-scan icon"></i>
        <div>3d-cube-scan</div>
      </div>
      <div class="icon-card">
        <i class="saxi-twotone saxi-3d-rotate icon"></i>
        <div>3d-rotate</div>
      </div>
    </div>
    
    <h2>Bulk Style (saxi-bulk)</h2>
    <div class="icon-grid">
      <div class="icon-card">
        <i class="saxi-bulk saxi-24-support icon"></i>
        <div>24-support</div>
      </div>
      <div class="icon-card">
        <i class="saxi-bulk saxi-3d-cube-scan icon"></i>
        <div>3d-cube-scan</div>
      </div>
      <div class="icon-card">
        <i class="saxi-bulk saxi-3d-rotate icon"></i>
        <div>3d-rotate</div>
      </div>
    </div>
  </div>
  
  <script>
    // Font loading detection
    window.addEventListener('DOMContentLoaded', () => {
      // Check if fonts loaded successfully
      setTimeout(() => {
        const testIcon = document.createElement('i');
        testIcon.className = 'saxi-solid saxi-user';
        testIcon.style.visibility = 'hidden';
        document.body.appendChild(testIcon);
        
        const fontLoaded = window.getComputedStyle(testIcon).fontFamily.includes('saxi-icons');
        if (!fontLoaded) {
          document.getElementById('font-error').style.display = 'block';
        }
        
        document.body.removeChild(testIcon);
      }, 1000);
    });
  </script>
</body>
</html>`;

  await fs.writeFile(testHtmlPath, content);
  console.log('Created test HTML file at:', testHtmlPath);
}

async function createInlineTestHtml() {
  const testHtmlPath = path.join(__dirname, '..', 'Fonts', 'inline-test.html');
  
  // Get the font files that were actually generated
  const files = await fs.readdir(path.join(__dirname, '..', 'Fonts'));
  const woffFiles = files.filter(f => f.endsWith('.woff') || f.endsWith('.woff2'));
  
  // Create font-face declarations for each font file (using only WOFF/WOFF2)
  let fontFaces = '';
  const processedFamilies = new Set();
  
  for (const fontFile of woffFiles) {
    // Skip processing if not a font file
    if (!fontFile.includes('-pro-')) continue;
    
    const fontName = fontFile.replace(/\.(woff|woff2)$/, '');
    const fontFamily = fontName.includes('twotone') ? 'saxi-icons-pro-twotone' : 'saxi-icons-pro';
    const fontWeight = fontName.includes('bold') || fontName.includes('bulk') ? 700 : 
                      fontName.includes('outline') ? 300 : 400;
    
    // Create a unique key for this family+weight combination
    const familyKey = `${fontFamily}-${fontWeight}`;
    
    // Only add each family+weight combo once
    if (!processedFamilies.has(familyKey)) {
      processedFamilies.add(familyKey);
      
      // Find matching woff2 and woff files
      const woff2File = files.find(f => f.startsWith(fontName) && f.endsWith('.woff2'));
      const woffFile = files.find(f => f.startsWith(fontName) && f.endsWith('.woff'));
      
      // Build the src attribute with format
      let src = [];
      if (woff2File) src.push(`url('${woff2File}') format('woff2')`);
      if (woffFile) src.push(`url('${woffFile}') format('woff')`);
      
      if (src.length > 0) {
        fontFaces += `
@font-face {
  font-family: '${fontFamily}';
  src: ${src.join(',\n       ')};
  font-weight: ${fontWeight};
  font-style: normal !important;
  font-display: block;
}`;
      }
    }
  }
  
  const content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Icon Font Inline Test</title>
  <style>
    /* Critical CSS to prevent layout shifts */
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      margin: 0;
      padding: 0;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    .page-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    /* Hide content until fonts are loaded */
    .fonts-loaded body {
      opacity: 1;
    }
  </style>
  <script>
    // Font loading detection
    document.fonts.ready.then(() => {
      document.documentElement.classList.add('fonts-loaded');
    });
  </script>
  <style>
    /* Inline font-face declarations */
    ${fontFaces}
    
    /* Icon classes */
    .saxi-solid {
      font-family: 'saxi-icons-pro';
      font-weight: 700;
      font-style: normal !important;
    }
    .saxi-regular {
      font-family: 'saxi-icons-pro';
      font-weight: 400;
      font-style: normal !important;
    }
    .saxi-light {
      font-family: 'saxi-icons-pro';
      font-weight: 300;
      font-style: normal !important;
    }
    .saxi-broken {
      font-family: 'saxi-icons-pro';
      font-weight: 400;
      font-style: normal !important;
    }
    .saxi-twotone {
      font-family: 'saxi-icons-pro-twotone';
      font-weight: 400;
      font-style: normal !important;
    }
    .saxi-bulk {
      font-family: 'saxi-icons-pro-twotone';
      font-weight: 700;
      font-style: normal !important;
    }
    
    .icon-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .icon-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      border-radius: 8px;
      background-color: #f5f5f5;
      text-align: center;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .icon {
      font-size: 32px;
      margin-bottom: 10px;
      display: inline-block;
      height: 32px;
      width: 32px;
      line-height: 1;
    }
    h2 {
      margin-top: 40px;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }
    
    .font-error-message {
      display: none;
      padding: 15px;
      background-color: #fff3cd;
      color: #856404;
      border: 1px solid #ffeeba;
      border-radius: 4px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="page-container">
    <h1>Icon Font Inline Test</h1>
    
    <div id="font-error" class="font-error-message">
      Some icon fonts may not be loading correctly. Please ensure the font files are properly generated.
    </div>
    
    <h2>Bold Style (saxi-solid)</h2>
    <div class="icon-grid">
      <div class="icon-card">
        <i class="saxi-solid icon">24-support</i>
        <div>24-support</div>
      </div>
      <div class="icon-card">
        <i class="saxi-solid icon">3d-cube-scan</i>
        <div>3d-cube-scan</div>
      </div>
      <div class="icon-card">
        <i class="saxi-solid icon">3d-rotate</i>
        <div>3d-rotate</div>
      </div>
    </div>
    
    <h2>Linear Style (saxi-regular)</h2>
    <div class="icon-grid">
      <div class="icon-card">
        <i class="saxi-regular icon">24-support</i>
        <div>24-support</div>
      </div>
      <div class="icon-card">
        <i class="saxi-regular icon">3d-cube-scan</i>
        <div>3d-cube-scan</div>
      </div>
      <div class="icon-card">
        <i class="saxi-regular icon">3d-rotate</i>
        <div>3d-rotate</div>
      </div>
    </div>
    
    <h2>Outline Style (saxi-light)</h2>
    <div class="icon-grid">
      <div class="icon-card">
        <i class="saxi-light icon">24-support</i>
        <div>24-support</div>
      </div>
      <div class="icon-card">
        <i class="saxi-light icon">3d-cube-scan</i>
        <div>3d-cube-scan</div>
      </div>
      <div class="icon-card">
        <i class="saxi-light icon">3d-rotate</i>
        <div>3d-rotate</div>
      </div>
    </div>
    
    <h2>Broken Style (saxi-broken)</h2>
    <div class="icon-grid">
      <div class="icon-card">
        <i class="saxi-broken icon">24-support</i>
        <div>24-support</div>
      </div>
      <div class="icon-card">
        <i class="saxi-broken icon">3d-cube-scan</i>
        <div>3d-cube-scan</div>
      </div>
      <div class="icon-card">
        <i class="saxi-broken icon">3d-rotate</i>
        <div>3d-rotate</div>
      </div>
    </div>
    
    <h2>TwoTone Style (saxi-twotone)</h2>
    <div class="icon-grid">
      <div class="icon-card">
        <i class="saxi-twotone icon">24-support</i>
        <div>24-support</div>
      </div>
      <div class="icon-card">
        <i class="saxi-twotone icon">3d-cube-scan</i>
        <div>3d-cube-scan</div>
      </div>
      <div class="icon-card">
        <i class="saxi-twotone icon">3d-rotate</i>
        <div>3d-rotate</div>
      </div>
    </div>
    
    <h2>Bulk Style (saxi-bulk)</h2>
    <div class="icon-grid">
      <div class="icon-card">
        <i class="saxi-bulk icon">24-support</i>
        <div>24-support</div>
      </div>
      <div class="icon-card">
        <i class="saxi-bulk icon">3d-cube-scan</i>
        <div>3d-cube-scan</div>
      </div>
      <div class="icon-card">
        <i class="saxi-bulk icon">3d-rotate</i>
        <div>3d-rotate</div>
      </div>
    </div>
  </div>
  
  <script>
    // Font loading detection
    window.addEventListener('DOMContentLoaded', () => {
      // Check if fonts loaded successfully
      setTimeout(() => {
        const testIcon = document.createElement('i');
        testIcon.className = 'saxi-solid';
        testIcon.textContent = 'user';
        testIcon.style.visibility = 'hidden';
        document.body.appendChild(testIcon);
        
        const fontLoaded = window.getComputedStyle(testIcon).fontFamily.includes('saxi-icons');
        if (!fontLoaded) {
          document.getElementById('font-error').style.display = 'block';
        }
        
        document.body.removeChild(testIcon);
      }, 1000);
    });
  </script>
</body>
</html>`;

  await fs.writeFile(testHtmlPath, content);
  console.log('Created inline test HTML file at:', testHtmlPath);
}

async function createSvgTestHtml() {
  const svgTestHtmlPath = path.join(__dirname, '..', 'Fonts', 'svg-test.html');
  const content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SVG Icon Test</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      margin: 0;
      padding: 0;
    }
    .page-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    .icon-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .icon-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      border-radius: 8px;
      background-color: #f5f5f5;
      text-align: center;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .icon {
      width: 32px;
      height: 32px;
      margin-bottom: 10px;
    }
    h2 {
      margin-top: 40px;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="page-container">
    <h1>SVG Icon Test</h1>
    <p>This page tests the original SVG files to ensure they display correctly.</p>
    
    <h2>Bold Style</h2>
    <div class="icon-grid">
      <div class="icon-card">
        <img src="../temp_svgs/Bold/24-support.svg" class="icon" alt="24-support">
        <div>24-support</div>
      </div>
      <div class="icon-card">
        <img src="../temp_svgs/Bold/3d-cube-scan.svg" class="icon" alt="3d-cube-scan">
        <div>3d-cube-scan</div>
      </div>
      <div class="icon-card">
        <img src="../temp_svgs/Bold/3d-rotate.svg" class="icon" alt="3d-rotate">
        <div>3d-rotate</div>
      </div>
    </div>
    
    <h2>Linear Style</h2>
    <div class="icon-grid">
      <div class="icon-card">
        <img src="../temp_svgs/Linear/24-support.svg" class="icon" alt="24-support">
        <div>24-support</div>
      </div>
      <div class="icon-card">
        <img src="../temp_svgs/Linear/3d-cube-scan.svg" class="icon" alt="3d-cube-scan">
        <div>3d-cube-scan</div>
      </div>
      <div class="icon-card">
        <img src="../temp_svgs/Linear/3d-rotate.svg" class="icon" alt="3d-rotate">
        <div>3d-rotate</div>
      </div>
    </div>
  </div>
</body>
</html>`;

  await fs.writeFile(svgTestHtmlPath, content);
  console.log('Created SVG test HTML file at:', svgTestHtmlPath);
}

async function generateDocumentation() {
  console.log('Generating icon font documentation...');
  
  try {
    // Run the glyphs-readme generator
    const result = await execScript('scripts/generate-glyphs-readme.js');
    console.log('Documentation generated successfully!');
    return result;
  } catch (error) {
    console.error('Error generating glyphs documentation:', error);
    throw error;
  }
}

/**
 * Save build information including version, timestamp, and icon count
 */
async function saveBuildInfo(iconCount) {
  console.log('Saving build information...');
  const buildInfo = {
    version: process.env.npm_package_version || '1.0.0',
    buildDate: new Date().toISOString(),
    iconCount: iconCount,
    styles: ['bold', 'regular', 'light', 'broken', 'twotone', 'bulk']
  };
  
  const buildInfoPath = path.join(__dirname, '..', 'Fonts', 'build-info.json');
  await fs.writeJson(buildInfoPath, buildInfo, { spaces: 2 });
  console.log('Build information saved to:', buildInfoPath);
}

/**
 * Create a single icon test page
 */
async function createSingleIconTestHtml() {
  const singleIconTestHtmlPath = path.join(__dirname, '..', 'Fonts', 'single-icon-test.html');
  const content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Single Icon Test</title>
  <style>
    /* Critical CSS to prevent layout shifts */
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      margin: 0;
      padding: 0;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    .fonts-loaded body {
      opacity: 1;
    }
    .page-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    .test-section {
      margin-bottom: 40px;
      padding: 20px;
      border-radius: 8px;
      background-color: #f5f5f5;
    }
    .icon-row {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      padding: 10px;
      border-radius: 4px;
      background-color: white;
    }
    .icon-demo {
      font-size: 32px;
      margin-right: 20px;
      min-width: 40px;
      text-align: center;
    }
    .icon-code {
      font-family: monospace;
      background-color: #f0f0f0;
      padding: 5px 10px;
      border-radius: 4px;
      margin-left: auto;
    }
    h2 {
      margin-top: 30px;
      margin-bottom: 20px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 10px;
    }
    
    /* Ensure all icons have normal font-style */
    [class^="saxi-"], [class*=" saxi-"] {
      font-style: normal !important;
      line-height: 1;
    }
    
    .debug-info {
      background-color: #f8f9fa;
      border: 1px solid #ddd;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 20px;
      font-family: monospace;
      white-space: pre-wrap;
      max-height: 200px;
      overflow: auto;
    }
  </style>
  <link rel="stylesheet" href="saxi-icons-all.css">
  <script>
    // Font loading detection
    document.fonts.ready.then(() => {
      document.documentElement.classList.add('fonts-loaded');
      
      // Debug font information
      const debugInfo = document.getElementById('debug-fonts');
      if (debugInfo) {
        const loadedFonts = [];
        document.fonts.forEach(font => {
          loadedFonts.push(font.family + ' - ' + font.style + ' - ' + font.weight + ' - ' + font.status);
        });
        debugInfo.textContent = loadedFonts.join('\\n');
      }
    });
  </script>
</head>
<body>
  <div class="page-container">
    <h1>Single Icon Test</h1>
    <p>This page tests a single icon across all available styles and formats.</p>
    
    <h2>Font Loading Debug</h2>
    <div id="debug-fonts" class="debug-info">Loading font information...</div>
    
    <h2>Using Class-Based Approach</h2>
    <div class="test-section">
      <div class="icon-row">
        <div class="icon-demo"><i class="saxi-solid saxi-home"></i></div>
        <div>Bold Style (saxi-solid)</div>
        <div class="icon-code">&lt;i class="saxi-solid saxi-home"&gt;&lt;/i&gt;</div>
      </div>
      
      <div class="icon-row">
        <div class="icon-demo"><i class="saxi-regular saxi-home"></i></div>
        <div>Linear Style (saxi-regular)</div>
        <div class="icon-code">&lt;i class="saxi-regular saxi-home"&gt;&lt;/i&gt;</div>
      </div>
      
      <div class="icon-row">
        <div class="icon-demo"><i class="saxi-light saxi-home"></i></div>
        <div>Outline Style (saxi-light)</div>
        <div class="icon-code">&lt;i class="saxi-light saxi-home"&gt;&lt;/i&gt;</div>
      </div>
      
      <div class="icon-row">
        <div class="icon-demo"><i class="saxi-broken saxi-home"></i></div>
        <div>Broken Style (saxi-broken)</div>
        <div class="icon-code">&lt;i class="saxi-broken saxi-home"&gt;&lt;/i&gt;</div>
      </div>
      
      <div class="icon-row">
        <div class="icon-demo"><i class="saxi-twotone saxi-home"></i></div>
        <div>TwoTone Style (saxi-twotone)</div>
        <div class="icon-code">&lt;i class="saxi-twotone saxi-home"&gt;&lt;/i&gt;</div>
      </div>
      
      <div class="icon-row">
        <div class="icon-demo"><i class="saxi-bulk saxi-home"></i></div>
        <div>Bulk Style (saxi-bulk)</div>
        <div class="icon-code">&lt;i class="saxi-bulk saxi-home"&gt;&lt;/i&gt;</div>
      </div>
    </div>
    
    <h2>Using Font Weight Approach</h2>
    <div class="test-section">
      <div class="icon-row">
        <div class="icon-demo"><i class="saxi-fw-bold saxi-home"></i></div>
        <div>Bold Style (font-weight: 700)</div>
        <div class="icon-code">&lt;i class="saxi-fw-bold saxi-home"&gt;&lt;/i&gt;</div>
      </div>
      
      <div class="icon-row">
        <div class="icon-demo"><i class="saxi-fw-regular saxi-home"></i></div>
        <div>Linear Style (font-weight: 400)</div>
        <div class="icon-code">&lt;i class="saxi-fw-regular saxi-home"&gt;&lt;/i&gt;</div>
      </div>
      
      <div class="icon-row">
        <div class="icon-demo"><i class="saxi-fw-light saxi-home"></i></div>
        <div>Outline Style (font-weight: 300)</div>
        <div class="icon-code">&lt;i class="saxi-fw-light saxi-home"&gt;&lt;/i&gt;</div>
      </div>
      
      <div class="icon-row">
        <div class="icon-demo"><i class="saxi-fw-broken saxi-home"></i></div>
        <div>Broken Style (font-weight: 100)</div>
        <div class="icon-code">&lt;i class="saxi-fw-broken saxi-home"&gt;&lt;/i&gt;</div>
      </div>
      
      <div class="icon-row">
        <div class="icon-demo"><i class="saxi-fw-twotone saxi-home"></i></div>
        <div>TwoTone Style (font-weight: 500)</div>
        <div class="icon-code">&lt;i class="saxi-fw-twotone saxi-home"&gt;&lt;/i&gt;</div>
      </div>
      
      <div class="icon-row">
        <div class="icon-demo"><i class="saxi-fw-bulk saxi-home"></i></div>
        <div>Bulk Style (font-weight: 600)</div>
        <div class="icon-code">&lt;i class="saxi-fw-bulk saxi-home"&gt;&lt;/i&gt;</div>
      </div>
    </div>
    
    <h2>Using Inline Styles</h2>
    <div class="test-section">
      <div class="icon-row">
        <div class="icon-demo"><i style="font-family: 'saxi-icons-pro'; font-weight: 700;" class="saxi-home"></i></div>
        <div>Bold Style (inline)</div>
        <div class="icon-code">&lt;i style="font-family: 'saxi-icons-pro'; font-weight: 700;" class="saxi-home"&gt;&lt;/i&gt;</div>
      </div>
      
      <div class="icon-row">
        <div class="icon-demo"><i style="font-family: 'saxi-icons-pro'; font-weight: 400;" class="saxi-home"></i></div>
        <div>Linear Style (inline)</div>
        <div class="icon-code">&lt;i style="font-family: 'saxi-icons-pro'; font-weight: 400;" class="saxi-home"&gt;&lt;/i&gt;</div>
      </div>
      
      <div class="icon-row">
        <div class="icon-demo"><i style="font-family: 'saxi-icons-pro'; font-weight: 300;" class="saxi-home"></i></div>
        <div>Outline Style (inline)</div>
        <div class="icon-code">&lt;i style="font-family: 'saxi-icons-pro'; font-weight: 300;" class="saxi-home"&gt;&lt;/i&gt;</div>
      </div>
    </div>
  </div>
</body>
</html>`;

  await fs.writeFile(singleIconTestHtmlPath, content);
  console.log('Created single icon test HTML file at:', singleIconTestHtmlPath);
}

async function createDemoHtml() {
  console.log('Creating demo HTML file...');
  
  try {
    // Get icon mapping from JSON files
    const mainMapping = await fs.readJson(path.join(__dirname, '..', 'Fonts', 'saxi-icons-pro.json'));
    const twotoneMapping = await fs.readJson(path.join(__dirname, '..', 'Fonts', 'saxi-icons-pro-twotone.json'));
    
    // Combine mappings and sort alphabetically
    const allIcons = Array.from(new Set([...Object.keys(mainMapping), ...Object.keys(twotoneMapping)])).sort();
    
    // Select a subset of icons to display (to keep the file size reasonable)
    const sampleIcons = allIcons.slice(0, 100);
    
    // Create HTML content
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SAXI Icons Font Demo</title>
  <style>
    /* Critical CSS to prevent layout shifts */
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      margin: 0;
      padding: 0;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    .page-container {
      padding: 30px;
      max-width: 1400px;
      margin: 0 auto;
    }
    
    /* Hide content until fonts are loaded */
    .fonts-loaded body {
      opacity: 1;
    }
  </style>
  <link rel="stylesheet" href="saxi-icons-all.css">
  <script>
    // Font loading detection
    document.fonts.ready.then(() => {
      document.documentElement.classList.add('fonts-loaded');
    });
  </script>
  <style>
    * {
      box-sizing: border-box;
    }
    
    body {
      line-height: 1.6;
      color: #333;
    }
    
    h1, h2, h3 {
      margin-bottom: 20px;
      color: #222;
    }
    
    .styles-container {
      margin-bottom: 40px;
    }
    
    .style-row {
      display: flex;
      flex-wrap: wrap;
      margin-bottom: 30px;
    }
    
    .style-header {
      width: 100%;
      padding: 10px 0;
      margin-bottom: 15px;
      border-bottom: 1px solid #eee;
      font-weight: bold;
      font-size: 18px;
      color: #555;
    }
    
    .icon-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 120px;
      height: 120px;
      margin: 10px;
      padding: 10px;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
      background-color: white;
      position: relative;
    }
    
    .icon-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
      z-index: 1;
    }
    
    .icon {
      font-size: 32px;
      margin-bottom: 12px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .icon-name {
      font-size: 11px;
      text-align: center;
      word-break: break-word;
      color: #666;
    }
    
    .style-badge {
      position: absolute;
      top: 5px;
      right: 5px;
      font-size: 8px;
      padding: 2px 5px;
      border-radius: 4px;
      color: white;
      background-color: #7b68ee;
    }
    
    .search-container {
      margin-bottom: 30px;
    }
    
    .search-input {
      width: 100%;
      max-width: 500px;
      padding: 10px 15px;
      border-radius: 25px;
      border: 1px solid #ccc;
      font-size: 16px;
    }
    
    .style-switcher {
      display: flex;
      margin-bottom: 30px;
      flex-wrap: wrap;
    }
    
    .style-button {
      padding: 8px 15px;
      margin-right: 10px;
      margin-bottom: 10px;
      border-radius: 4px;
      border: none;
      background-color: #f1f1f1;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .style-button.active {
      background-color: #7b68ee;
      color: white;
    }
    
    .icon-grid {
      display: flex;
      flex-wrap: wrap;
    }
    
    .no-results {
      width: 100%;
      padding: 20px;
      text-align: center;
      color: #666;
    }
    
    .font-error-message {
      display: none;
      padding: 15px;
      background-color: #fff3cd;
      color: #856404;
      border: 1px solid #ffeeba;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    
    @media (max-width: 768px) {
      .icon-card {
        width: 100px;
        height: 100px;
      }
      
      .icon {
        font-size: 24px;
      }
      
      .icon-name {
        font-size: 10px;
      }
    }
  </style>
</head>
<body>
  <div class="page-container">
    <h1>SAXI Icons Font Demo</h1>
    <p>All icon styles should display correctly. Test the fonts below to verify they're working properly.</p>
    
    <div id="font-error" class="font-error-message">
      Some icon fonts may not be loading correctly. Please ensure the font files are properly generated.
    </div>
    
    <div class="search-container">
      <input type="text" class="search-input" placeholder="Search icons..." id="searchInput">
    </div>
    
    <div class="style-switcher">
      <button class="style-button active" data-style="all">All Styles</button>
      <button class="style-button" data-style="solid">Solid</button>
      <button class="style-button" data-style="regular">Regular</button>
      <button class="style-button" data-style="light">Light</button>
      <button class="style-button" data-style="broken">Broken</button>
      <button class="style-button" data-style="twotone">TwoTone</button>
      <button class="style-button" data-style="bulk">Bulk</button>
    </div>
    
    <div class="styles-container">
      <!-- Icon Grid will be inserted here by JavaScript -->
      <div id="icon-grid" class="icon-grid"></div>
    </div>
  </div>
  
  <script>
    // Font loading detection
    window.addEventListener('DOMContentLoaded', () => {
      // Check if fonts loaded successfully
      setTimeout(() => {
        const testIcon = document.createElement('i');
        testIcon.className = 'saxi-solid saxi-user';
        testIcon.style.visibility = 'hidden';
        document.body.appendChild(testIcon);
        
        const fontLoaded = window.getComputedStyle(testIcon).fontFamily.includes('saxi-icons');
        if (!fontLoaded) {
          document.getElementById('font-error').style.display = 'block';
        }
        
        document.body.removeChild(testIcon);
      }, 1000);
    });

    // Icon data
    const icons = ${JSON.stringify(sampleIcons)};
    
    // DOM Elements
    const iconGrid = document.getElementById('icon-grid');
    const searchInput = document.getElementById('searchInput');
    const styleButtons = document.querySelectorAll('.style-button');
    
    // State
    let currentStyle = 'all';
    let searchTerm = '';
    
    // Render icons based on current state
    function renderIcons() {
      iconGrid.innerHTML = '';
      
      const filteredIcons = icons.filter(icon => 
        icon.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (filteredIcons.length === 0) {
        iconGrid.innerHTML = '<div class="no-results">No icons found matching your search</div>';
        return;
      }
      
      filteredIcons.forEach(icon => {
        if (currentStyle === 'all') {
          // Create a card for each style
          createIconCard(icon, 'solid');
          createIconCard(icon, 'regular');
          createIconCard(icon, 'light');
          createIconCard(icon, 'broken');
          createIconCard(icon, 'twotone');
          createIconCard(icon, 'bulk');
        } else {
          createIconCard(icon, currentStyle);
        }
      });
    }
    
    // Create an icon card for a specific style
    function createIconCard(icon, style) {
      const card = document.createElement('div');
      card.className = 'icon-card';
      
      const iconSpan = document.createElement('span');
      iconSpan.className = 'icon';
      
      // Map style to appropriate CSS class
      const styleCssClass = 
        style === 'solid' ? 'saxi-solid' : 
        style === 'regular' ? 'saxi-regular' : 
        style === 'light' ? 'saxi-light' : 
        style === 'broken' ? 'saxi-broken' : 
        style === 'twotone' ? 'saxi-twotone' : 
        style === 'bulk' ? 'saxi-bulk' : '';
      
      iconSpan.className = \`icon \${styleCssClass} saxi-\${icon}\`;
      
      const nameSpan = document.createElement('span');
      nameSpan.className = 'icon-name';
      nameSpan.textContent = icon;
      
      const styleBadge = document.createElement('span');
      styleBadge.className = 'style-badge';
      styleBadge.textContent = style;
      
      card.appendChild(styleBadge);
      card.appendChild(iconSpan);
      card.appendChild(nameSpan);
      
      iconGrid.appendChild(card);
    }
    
    // Event Handlers
    searchInput.addEventListener('input', e => {
      searchTerm = e.target.value;
      renderIcons();
    });
    
    styleButtons.forEach(button => {
      button.addEventListener('click', () => {
        styleButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentStyle = button.dataset.style;
        renderIcons();
      });
    });
    
    // Initial render
    renderIcons();
  </script>
</body>
</html>`;
    
    // Create the demo HTML file in the Fonts directory
    const outputPath = path.join(__dirname, '..', 'Fonts', 'demo.html');
    await fs.writeFile(outputPath, html);
    
    console.log(`Demo HTML file created at: ${outputPath}`);
    return true;
  } catch (error) {
    console.error('Error creating demo HTML:', error);
    return false;
  }
}

/**
 * Execute a JavaScript file using Node.js
 */
async function execScript(scriptPath) {
  return new Promise((resolve, reject) => {
    // Use node to execute the script instead of trying to run it directly
    const fullPath = path.join(__dirname, '..', scriptPath);
    console.log(`Executing script: node ${fullPath}`);
    
    const childProcess = spawn('node', [fullPath], {
      stdio: 'inherit'  // This makes the child process share the same stdout/stderr
    });
    
    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        reject(new Error(`${scriptPath} exited with code ${code}`));
      }
    });
    
    childProcess.on('error', (error) => {
      reject(new Error(`Error executing ${scriptPath}: ${error.message}`));
    });
  });
}

build();