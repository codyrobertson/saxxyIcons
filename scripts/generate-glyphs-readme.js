/**
 * generate-glyphs-readme.js
 * 
 * This script generates a documentation README.md for the icon font,
 * including a table with all glyphs, their names, unicode values, and example usage.
 * 
 * It:
 *  1. Reads the JSON mapping files for each family
 *  2. Extracts SVG contents from temp directory to show previews
 *  3. Generates a comprehensive markdown table
 *  4. Creates a dedicated README.md in the Fonts directory
 * 
 * Run after build-icon-font.js but before cleaning temp directories.
 */

const fs = require('fs-extra');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

// Directories
const OUTPUT_DIR = path.join(__dirname, '..', 'Fonts');
const TEMP_DIR = path.join(__dirname, '..', 'temp_svgs');
const README_PATH = path.join(OUTPUT_DIR, 'Icon-Font-README.md');

/**
 * Read all JSON mapping files and combine them into a single object
 * with family information.
 */
async function readAllMappings() {
  const files = await fs.readdir(OUTPUT_DIR);
  const jsonFiles = files.filter(f => f.endsWith('.json') && !f.includes('build-info'));
  
  let allIcons = [];
  
  for (const jsonFile of jsonFiles) {
    const filePath = path.join(OUTPUT_DIR, jsonFile);
    const mapping = await fs.readJson(filePath);
    const family = path.basename(jsonFile, '.json');
    
    // Map family names to CSS prefixes and style details
    let styleDetails;
    if (family === 'saxi-icons-pro') {
      styleDetails = [
        { name: 'Bold', weight: 700, cssPrefix: 'saxi-solid' },
        { name: 'Linear', weight: 400, cssPrefix: 'saxi-regular' },
        { name: 'Outline', weight: 300, cssPrefix: 'saxi-light' },
        { name: 'Broken', weight: 400, cssPrefix: 'saxi-broken' }
      ];
    } else if (family === 'saxi-icons-pro-twotone') {
      styleDetails = [
        { name: 'TwoTone', weight: 400, cssPrefix: 'saxi-twotone' },
        { name: 'Bulk', weight: 700, cssPrefix: 'saxi-bulk' }
      ];
    } else {
      // Default style details if family is unknown
      styleDetails = [{ name: 'Regular', weight: 400, cssPrefix: family }];
    }
    
    // Convert each icon to an object with name, unicode, and family
    const icons = Object.entries(mapping).map(([name, unicode]) => ({
      name,
      unicode,
      family,
      // Extract family and style details
      familyName: family,
      familyDetails: styleDetails
    }));
    
    allIcons = [...allIcons, ...icons];
  }
  
  return allIcons;
}

/**
 * Generate a markdown table with all icons.
 */
async function generateIconTable(icons) {
  // Table header
  let table = [
    '## Icon Table',
    '',
    '| Icon | Name | Unicode | CSS Class | Usage Example |',
    '|------|------|---------|-----------|---------------|'
  ];
  
  // Sort icons by name
  icons.sort((a, b) => a.name.localeCompare(b.name));
  
  // Add rows for each icon
  for (const icon of icons) {
    const familyName = icon.familyName.replace('saxi-icons-pro', 'SAXI').replace('-', ' ');
    const cssClasses = icon.familyDetails.map(style => `\`${style.cssPrefix}\``).join(', ');
    const usageHtml = `<i class="${icon.familyDetails[0].cssPrefix} saxi-${icon.name}"></i>`;
    const usageLigature = `<i class="${icon.familyDetails[0].cssPrefix}">${icon.name}</i>`;
    
    table.push(`| &#x${icon.unicode}; | \`${icon.name}\` | \`\\${icon.unicode}\` | ${cssClasses} | \`${usageHtml}\` or \`${usageLigature}\` |`);
  }
  
  return table.join('\n');
}

/**
 * Generate categorized icon tables, if category information is available.
 */
function generateCategorizedTables(icons) {
  // Extract potential categories from icon names (e.g., "arrow-up" -> "arrow")
  const categoryMap = {};
  
  icons.forEach(icon => {
    // Try to extract category from name (before first dash)
    const parts = icon.name.split('-');
    if (parts.length > 1) {
      const category = parts[0];
      if (!categoryMap[category]) {
        categoryMap[category] = [];
      }
      categoryMap[category].push(icon);
    } else {
      // No category found, use "Misc"
      if (!categoryMap['Misc']) {
        categoryMap['Misc'] = [];
      }
      categoryMap['Misc'].push(icon);
    }
  });
  
  // Generate tables for each category
  let tables = ['## Icon Categories'];
  
  // Sort categories alphabetically
  const sortedCategories = Object.keys(categoryMap).sort();
  
  for (const category of sortedCategories) {
    tables.push(`\n### ${category.charAt(0).toUpperCase() + category.slice(1)} Icons\n`);
    tables.push('| Icon | Name | Unicode | Style Options |');
    tables.push('|------|------|---------|---------------|');
    
    // Sort icons by name within the category
    categoryMap[category].sort((a, b) => a.name.localeCompare(b.name));
    
    categoryMap[category].forEach(icon => {
      const styleOptions = icon.familyDetails.map(style => `\`${style.cssPrefix}\``).join(', ');
      tables.push(`| &#x${icon.unicode}; | \`${icon.name}\` | \`\\${icon.unicode}\` | ${styleOptions} |`);
    });
  }
  
  return tables.join('\n');
}

/**
 * Generate usage examples in HTML, CSS, and JavaScript.
 */
function generateUsageExamples(icons) {
  // Get a sample unicode if available
  const sampleUnicode = icons && icons.length > 0 ? icons[0].unicode : 'E900';
  
  return `
## Usage Examples

### HTML with CSS Classes

\`\`\`html
<!-- Using style variants -->
<i class="saxi-solid saxi-archive-add"></i>    <!-- Bold style -->
<i class="saxi-regular saxi-archive-add"></i>  <!-- Linear/Regular style -->
<i class="saxi-light saxi-archive-add"></i>    <!-- Outline/Light style -->
<i class="saxi-twotone saxi-archive-add"></i>  <!-- TwoTone style -->
<i class="saxi-bulk saxi-archive-add"></i>     <!-- Bulk style -->
<i class="saxi-broken saxi-archive-add"></i>   <!-- Broken style -->
\`\`\`
`;
}
