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
    let cssPrefix, styleDetails;
    if (family === 'saxi-icons-pro') {
      cssPrefix = {
        'Bold': 'saxi-solid',
        'Linear': 'saxi-regular',
        'Outline': 'saxi-light'
      };
      styleDetails = [
        { name: 'Bold', weight: 700, cssPrefix: 'saxi-solid' },
        { name: 'Linear', weight: 400, cssPrefix: 'saxi-regular' },
        { name: 'Outline', weight: 300, cssPrefix: 'saxi-light' }
      ];
    } else if (family === 'saxi-icons-pro-duotone') {
      cssPrefix = { 'Duotone': 'saxi-duotone' };
      styleDetails = [{ name: 'Duotone', weight: 400, cssPrefix: 'saxi-duotone' }];
    } else if (family === 'saxi-icons-pro-broken') {
      cssPrefix = { 'Broken': 'saxi-broken' };
      styleDetails = [{ name: 'Broken', weight: 400, cssPrefix: 'saxi-broken' }];
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
<i class="saxi-duotone saxi-archive-add"></i>  <!-- Duotone style -->
<i class="saxi-broken saxi-archive-add"></i>   <!-- Broken style -->
\`\`\`

### HTML with Ligatures

\`\`\`html
<!-- Using ligatures (just type the icon name) -->
<i class="saxi-solid">archive-add</i>     <!-- Bold style -->
<i class="saxi-regular">archive-add</i>   <!-- Linear/Regular style -->
<i class="saxi-light">archive-add</i>     <!-- Outline/Light style -->
<i class="saxi-duotone">archive-add</i>   <!-- Duotone style -->
<i class="saxi-broken">archive-add</i>    <!-- Broken style -->
\`\`\`

### CSS

\`\`\`css
/* Basic icon styling */
.custom-icon {
  font-family: 'saxi-icons-pro';
  font-size: 24px;
  color: #3498db;
}

/* Using the :before pseudo-element with Unicode */
.download-button:before {
  content: "\\${sampleUnicode}";
  font-family: 'saxi-icons-pro';
  margin-right: 8px;
}

/* Style variants */
.icon-bold {
  font-weight: 700;  /* Bold */
}

.icon-regular {
  font-weight: 400;  /* Regular/Linear */
}

.icon-light {
  font-weight: 300;  /* Light/Outline */
}
\`\`\`

### Using in Design Tools (Figma, Canva, etc.)

1. Install the font files (.ttf) on your system.
2. In your design tool, select text and change the font to:
   - 'saxi-icons-pro' (with appropriate weight for Bold, Linear, or Outline)
   - 'saxi-icons-pro-duotone' for Duotone icons
   - 'saxi-icons-pro-broken' for Broken icons
3. Type the icon name (e.g., 'archive-add') to use the ligature.
4. Alternatively, you can paste the Unicode character directly.
`;
}

/**
 * Generate the full README with all sections.
 */
async function generateReadme(icons) {
  const date = new Date().toISOString().split('T')[0];
  const totalIcons = icons.length;
  const families = [...new Set(icons.map(icon => icon.familyName))];
  
  let readmeContent = [
    '# SAXI Icon Font Documentation',
    '',
    `Generated on: ${date}`,
    `Total Icons: ${totalIcons}`,
    `Families: ${families.join(', ')}`,
    '',
    '## Overview',
    '',
    'This icon font includes the following font files:',
    '',
    '- **saxi-icons-pro** - Main family with three weights:',
    '  - Bold (700) - Use with class `saxi-solid`',
    '  - Linear (400) - Use with class `saxi-regular`',
    '  - Outline (300) - Use with class `saxi-light`',
    '- **saxi-icons-pro-duotone** - Duotone style icons - Use with class `saxi-duotone`',
    '- **saxi-icons-pro-broken** - Broken style icons - Use with class `saxi-broken`',
    '',
    '## Features',
    '',
    '- **Multiple styles** available for each icon through font weights and families',
    '- **Ligature support** - Just type the icon name inside the element',
    '- **Unicode support** - Each icon has a dedicated Unicode code point',
    '- **FontAwesome-style classes** - Following the familiar pattern like `saxi-solid saxi-archive-add`',
    '',
    '## Installation',
    '',
    '### 1. Include CSS',
    '',
    '```html',
    '<link rel="stylesheet" href="Fonts/saxi-icons-all.css">',
    '<!-- Or include only what you need: -->',
    '<link rel="stylesheet" href="Fonts/saxi-icons-pro.css">',
    '<link rel="stylesheet" href="Fonts/saxi-icons-pro-duotone.css">',
    '<link rel="stylesheet" href="Fonts/saxi-icons-pro-broken.css">',
    '```',
    '',
    '### 2. Use icons in HTML',
    '',
    '```html',
    '<!-- Using CSS classes -->',
    '<i class="saxi-solid saxi-archive-add"></i>',
    '',
    '<!-- Using ligatures (just type the icon name) -->',
    '<i class="saxi-solid">archive-add</i>',
    '```',
    '',
    generateIconTable(icons),
    '',
    generateCategorizedTables(icons),
    '',
    generateUsageExamples(icons)
  ];
  
  return readmeContent.join('\n');
}

/**
 * Main function to generate the readme.
 */
async function main() {
  try {
    console.log('Generating icon font README...');
    
    // Read all mapping files
    const icons = await readAllMappings();
    console.log(`Found ${icons.length} icons across all families.`);
    
    // Generate the readme content
    const readmeContent = await generateReadme(icons);
    
    // Write the readme file
    await fs.writeFile(README_PATH, readmeContent);
    console.log(`Icon font README generated at: ${README_PATH}`);
    
  } catch (error) {
    console.error('Error generating README:', error);
  }
}

// Run the script
main();