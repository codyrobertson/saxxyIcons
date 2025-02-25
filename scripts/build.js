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
    await createSingleIconTest();
    
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
  <link rel="stylesheet" href="saxi-icons-all.css">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
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
    }
    .icon {
      font-size: 32px;
      margin-bottom: 10px;
    }
    h2 {
      margin-top: 40px;
    }
  </style>
</head>
<body>
  <h1>Icon Font Test</h1>
  
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
</body>
</html>`;

  await fs.writeFile(testHtmlPath, content);
  console.log('Created test HTML file at:', testHtmlPath);
}

async function createInlineTestHtml() {
  const testHtmlPath = path.join(__dirname, '..', 'Fonts', 'inline-test.html');
  
  // Get the font files that were actually generated
  const files = await fs.readdir(path.join(__dirname, '..', 'Fonts'));
  const fontFiles = files.filter(f => 
    f.endsWith('.ttf') || f.endsWith('.woff') || f.endsWith('.woff2') || f.endsWith('.eot') || f.endsWith('.svg')
  );
  
  // Create font-face declarations for each font file
  let fontFaces = '';
  for (const fontFile of fontFiles) {
    const fontName = fontFile.replace(/\.(ttf|woff|woff2|eot|svg)$/, '');
    const fontFamily = fontName.includes('twotone') ? 'saxi-icons-pro-twotone' : 'saxi-icons-pro';
    const fontWeight = fontName.includes('bold') || fontName.includes('bulk') ? 700 : 
                      fontName.includes('outline') ? 300 : 400;
    
    fontFaces += `
@font-face {
  font-family: '${fontFamily}';
  src: url('${fontFile}');
  font-weight: ${fontWeight};
  font-style: normal;
}`;
  }
  
  const content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Icon Font Inline Test</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    /* Inline font-face declarations */
    ${fontFaces}
    
    /* Icon classes */
    .saxi-solid {
      font-family: 'saxi-icons-pro';
      font-weight: 700;
    }
    .saxi-regular {
      font-family: 'saxi-icons-pro';
      font-weight: 400;
    }
    .saxi-light {
      font-family: 'saxi-icons-pro';
      font-weight: 300;
    }
    .saxi-broken {
      font-family: 'saxi-icons-pro';
      font-weight: 400;
    }
    .saxi-twotone {
      font-family: 'saxi-icons-pro-twotone';
      font-weight: 400;
    }
    .saxi-bulk {
      font-family: 'saxi-icons-pro-twotone';
      font-weight: 700;
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
    }
    .icon {
      font-size: 32px;
      margin-bottom: 10px;
    }
    h2 {
      margin-top: 40px;
    }
  </style>
</head>
<body>
  <h1>Icon Font Inline Test</h1>
  
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
</body>
</html>`;

  await fs.writeFile(testHtmlPath, content);
  console.log('Created inline test HTML file at:', testHtmlPath);
}

async function createSvgTestHtml() {
  // Get a few SVG files from each style
  const svgSamples = {};
  const styles = ['Bold', 'Linear', 'Outline', 'Broken', 'TwoTone', 'Bulk'];
  
  for (const style of styles) {
    const styleDir = path.join(__dirname, '..', 'temp_svgs', style);
    if (await fs.pathExists(styleDir)) {
      const files = await fs.readdir(styleDir);
      const svgFiles = files.filter(f => f.endsWith('.svg')).slice(0, 3);
      
      svgSamples[style.toLowerCase()] = [];
      
      for (const file of svgFiles) {
        const filePath = path.join(styleDir, file);
        const svgContent = await fs.readFile(filePath, 'utf8');
        svgSamples[style.toLowerCase()].push({
          name: path.basename(file, '.svg'),
          content: svgContent
        });
      }
    }
  }
  
  // Create HTML with inline SVGs
  const testHtmlPath = path.join(__dirname, '..', 'Fonts', 'svg-test.html');
  let content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SVG Icon Test</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
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
    }
    .icon {
      width: 32px;
      height: 32px;
      margin-bottom: 10px;
    }
    h2 {
      margin-top: 40px;
    }
  </style>
</head>
<body>
  <h1>SVG Icon Test</h1>`;
  
  // Add sections for each style
  for (const [style, icons] of Object.entries(svgSamples)) {
    content += `
  <h2>${style.charAt(0).toUpperCase() + style.slice(1)} Style</h2>
  <div class="icon-grid">`;
    
    for (const icon of icons) {
      content += `
    <div class="icon-card">
      <div class="icon">${icon.content}</div>
      <div>${icon.name}</div>
    </div>`;
    }
    
    content += `
  </div>`;
  }
  
  content += `
</body>
</html>`;

  await fs.writeFile(testHtmlPath, content);
  console.log('Created SVG test HTML file at:', testHtmlPath);
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
async function createSingleIconTest() {
  console.log('Creating single icon test page...');
  const testHtmlPath = path.join(__dirname, '..', 'Fonts', 'single-icon-test.html');
  
  // Find one icon name that exists in all styles
  const fontsDir = path.join(__dirname, '..', 'Fonts');
  const files = await fs.readdir(fontsDir);
  
  // Look for JSON mapping file
  const jsonFile = files.find(f => f.endsWith('.json') && f !== 'build-info.json');
  
  if (!jsonFile) {
    console.error('No icon mapping JSON file found.');
    return;
  }
  
  const mapping = await fs.readJson(path.join(fontsDir, jsonFile));
  const iconNames = Object.keys(mapping);
  
  if (iconNames.length === 0) {
    console.error('No icons found in mapping.');
    return;
  }
  
  // Use the first icon for the test
  const testIcon = iconNames[0];
  
  const content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Single Icon Test</title>
  <link rel="stylesheet" href="saxi-icons-all.css">
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .test-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 30px;
      margin-top: 30px;
    }
    .test-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    .size-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 40px;
    }
    .size-row {
      display: flex;
      align-items: center;
    }
    .size-label {
      width: 100px;
    }
  </style>
</head>
<body>
  <h1>Single Icon Test: "${testIcon}"</h1>
  
  <h2>Icon in Different Styles</h2>
  <div class="test-grid">
    <div class="test-item">
      <i class="saxi-solid saxi-${testIcon} icon"></i>
      <div>Solid</div>
    </div>
    <div class="test-item">
      <i class="saxi-regular saxi-${testIcon} icon"></i>
      <div>Regular</div>
    </div>
    <div class="test-item">
      <i class="saxi-light saxi-${testIcon} icon"></i>
      <div>Light</div>
    </div>
    <div class="test-item">
      <i class="saxi-broken saxi-${testIcon} icon"></i>
      <div>Broken</div>
    </div>
    <div class="test-item">
      <i class="saxi-twotone saxi-${testIcon} icon"></i>
      <div>TwoTone</div>
    </div>
    <div class="test-item">
      <i class="saxi-bulk saxi-${testIcon} icon"></i>
      <div>Bulk</div>
    </div>
  </div>
  
  <h2>Size Variations (Regular Style)</h2>
  <div class="size-grid">
    <div class="size-row">
      <div class="size-label">16px</div>
      <i class="saxi-regular saxi-${testIcon}" style="font-size: 16px;"></i>
    </div>
    <div class="size-row">
      <div class="size-label">24px</div>
      <i class="saxi-regular saxi-${testIcon}" style="font-size: 24px;"></i>
    </div>
    <div class="size-row">
      <div class="size-label">32px</div>
      <i class="saxi-regular saxi-${testIcon}" style="font-size: 32px;"></i>
    </div>
    <div class="size-row">
      <div class="size-label">48px</div>
      <i class="saxi-regular saxi-${testIcon}" style="font-size: 48px;"></i>
    </div>
    <div class="size-row">
      <div class="size-label">64px</div>
      <i class="saxi-regular saxi-${testIcon}" style="font-size: 64px;"></i>
    </div>
  </div>
</body>
</html>`;

  await fs.writeFile(testHtmlPath, content);
  console.log('Created single icon test HTML file at:', testHtmlPath);
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