/**
 * generate-demo.js
 * 
 * This script generates a demo HTML file showing all icons with various styles.
 * It reads the JSON mapping files to get the list of all icons.
 */

const fs = require('fs-extra');
const path = require('path');

// Paths
const OUTPUT_DIR = path.join(__dirname, '..', 'Fonts');
const TEMPLATE_DIR = path.join(__dirname, 'templates');
const TEMPLATE_FILE = path.join(TEMPLATE_DIR, 'demo.html');
const DEMO_OUTPUT = path.join(OUTPUT_DIR, 'demo.html');

async function generateDemo() {
  try {
    console.log('Generating demo HTML file...');
    
    // Read template
    await fs.ensureDir(TEMPLATE_DIR);
    
    if (!await fs.pathExists(TEMPLATE_FILE)) {
      console.log('Template file not found, creating default template...');
      // Copy default template content here
      // This template is modified dynamically later
      await fs.copy(path.join(__dirname, 'templates', 'demo.html'), TEMPLATE_FILE);
    }
    
    let templateHtml = await fs.readFile(TEMPLATE_FILE, 'utf8');
    
    // Read all JSON mapping files to get icon names
    const files = await fs.readdir(OUTPUT_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json') && !f.includes('build-info'));
    
    let allIcons = [];
    
    for (const jsonFile of jsonFiles) {
      const filePath = path.join(OUTPUT_DIR, jsonFile);
      const mapping = await fs.readJson(filePath);
      const icons = Object.keys(mapping);
      allIcons = [...allIcons, ...icons];
    }
    
    // Remove duplicates
    allIcons = [...new Set(allIcons)];
    // Sort alphabetically
    allIcons.sort();
    
    // Replace sample icon array in the template
    const iconArrayStr = JSON.stringify(allIcons, null, 2);
    templateHtml = templateHtml.replace(
      /const sampleIcons = \[([\s\S]*?)\];/,
      `const sampleIcons = ${iconArrayStr};`
    );
    
    // Write the demo HTML file
    await fs.writeFile(DEMO_OUTPUT, templateHtml);
    console.log(`Demo HTML file generated at: ${DEMO_OUTPUT}`);
    
  } catch (error) {
    console.error('Error generating demo:', error);
  }
}

generateDemo();