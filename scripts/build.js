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

async function build() {
  try {
    console.log('Starting icon font build process...');
    
    // Check if svg.zip exists in input directory
    const inputDir = path.join(__dirname, '..', 'input');
    const svgZipPath = path.join(inputDir, 'svg.zip');
    
    if (!await fs.pathExists(svgZipPath)) {
      console.error('Error: svg.zip not found in input directory!');
      console.log('Please place your svg.zip file in the "input" directory and try again.');
      process.exit(1);
    }
    
    // Copy svg.zip to root directory
    console.log('Copying svg.zip to root directory...');
    await fs.copy(svgZipPath, path.join(__dirname, '..', 'svg.zip'));
    
    // Run the build-icon-font.js script
    console.log('Running build-icon-font.js...');
    
    const buildProcess = spawn('node', [path.join(__dirname, '..', 'build-icon-font.js')], {
      stdio: 'inherit',
      shell: true
    });
    
    return new Promise((resolve, reject) => {
      buildProcess.on('close', async (code) => {
        if (code !== 0) {
          reject(new Error(`build-icon-font.js exited with code ${code}`));
          return;
        }
        
        try {
          // Generate glyphs README
          console.log('Generating icon font documentation...');
          const docsProcess = spawn('node', [path.join(__dirname, 'generate-glyphs-readme.js')], {
            stdio: 'inherit',
            shell: true
          });
          
          await new Promise((resolveDoc, rejectDoc) => {
            docsProcess.on('close', (docCode) => {
              if (docCode !== 0) {
                console.warn(`Warning: Icon documentation generation exited with code ${docCode}`);
              }
              resolveDoc();
            });
            
            docsProcess.on('error', (error) => {
              console.warn('Warning: Error generating icon documentation:', error);
              resolveDoc();
            });
          });
          
          // Generate demo HTML
          console.log('Generating demo HTML...');
          const demoProcess = spawn('node', [path.join(__dirname, 'generate-demo.js')], {
            stdio: 'inherit',
            shell: true
          });
          
          await new Promise((resolveDemo, rejectDemo) => {
            demoProcess.on('close', (demoCode) => {
              if (demoCode !== 0) {
                console.warn(`Warning: Demo HTML generation exited with code ${demoCode}`);
              }
              resolveDemo();
            });
            
            demoProcess.on('error', (error) => {
              console.warn('Warning: Error generating demo HTML:', error);
              resolveDemo();
            });
          });
          
          // Generate build info
          const buildInfoPath = path.join(__dirname, '..', 'Fonts', 'build-info.json');
          const packageJson = require('../package.json');
          
          const buildInfo = {
            version: packageJson.version,
            timestamp: new Date().toISOString(),
            buildDate: new Date().toLocaleDateString(),
            totalIcons: await countIcons()
          };
          
          await fs.writeJson(buildInfoPath, buildInfo, { spaces: 2 });
          console.log(`Build info saved to ${buildInfoPath}`);
          
          console.log('\nBuild completed successfully!');
          console.log(`Generated ${buildInfo.totalIcons} icons`);
          console.log('Check the "Fonts" directory for output files.');
          
          resolve();
        } catch (error) {
          reject(error);
        }
      });
      
      buildProcess.on('error', (error) => {
        reject(error);
      });
    });
    
  } catch (error) {
    console.error('Error during build:', error);
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

build();