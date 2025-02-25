/**
 * setup.js
 * 
 * Creates the necessary directory structure for the icon font generation process.
 */

const fs = require('fs-extra');
const path = require('path');

// Directories
const dirs = [
  'Fonts',
  'temp_svgs',
  'input'
];

async function setup() {
  try {
    console.log('Setting up directory structure...');
    
    // Create directories if they don't exist
    for (const dir of dirs) {
      const dirPath = path.join(__dirname, '..', dir);
      await fs.ensureDir(dirPath);
      console.log(`Created directory: ${dir}`);
    }
    
    // Create a README in the input directory
    const readmePath = path.join(__dirname, '..', 'input', 'README.md');
    const readmeContent = `# Icon Font Generator Input

Place your svg.zip file here.

The script expects SVG files to be in an "all" folder within the zip, with filenames that include the style:
- filename-bold.svg
- filename-linear.svg
- filename-outline.svg
- filename-broken.svg
- filename-twotone.svg
- filename-bulk.svg

The script will organize these files into appropriate style folders automatically.`;
    
    await fs.writeFile(readmePath, readmeContent);
    
    console.log('\nSetup complete!');
    console.log('\nNext steps:');
    console.log('1. Place your svg.zip file in the "input" directory');
    console.log('2. Run "npm run build" to generate the icon fonts');
  } catch (error) {
    console.error('Error during setup:', error);
  }
}

setup();