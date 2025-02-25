/**
 * build-icon-font.js
 *
 * This script automates the generation of an icon font from a provided svg.zip.
 *
 * It now handles the following folder structure:
 * - /all folder containing all SVG files
 * - TwoTone style has two weights: regular (twotone) and bold (bulk)
 *
 * Generates fonts for all styles with proper naming conventions.
 */

const AdmZip = require('adm-zip');
const webfontsGenerator = require('webfonts-generator');
const fs = require('fs-extra');
const path = require('path');

// Configuration
const ZIP_FILE = path.join(__dirname, 'input', 'svg.zip');
const TEMP_DIR = path.join(__dirname, 'temp_svgs');
const OUTPUT_DIR = path.join(__dirname, 'Fonts');

// Define style groups and weights
const groups = [
  {
    // Main family
    family: 'saxi-icons-pro',
    subStyles: [
      { style: 'Bold', weight: 700, outPrefix: 'saxi-icons-pro-bold', cssPrefix: 'saxi-solid' },
      { style: 'Linear', weight: 400, outPrefix: 'saxi-icons-pro-linear', cssPrefix: 'saxi-regular' },
      { style: 'Outline', weight: 300, outPrefix: 'saxi-icons-pro-outline', cssPrefix: 'saxi-light' },
      { style: 'Broken', weight: 400, outPrefix: 'saxi-icons-pro-broken', cssPrefix: 'saxi-broken' }
    ],
    mappingFile: 'saxi-icons-pro.json'
  },
  {
    // TwoTone family with two weights
    family: 'saxi-icons-pro-twotone',
    subStyles: [
      { style: 'TwoTone', weight: 400, outPrefix: 'saxi-icons-pro-twotone', cssPrefix: 'saxi-twotone' },
      { style: 'Bulk', weight: 700, outPrefix: 'saxi-icons-pro-bulk', cssPrefix: 'saxi-bulk' }
    ],
    mappingFile: 'saxi-icons-pro-twotone.json'
  }
];

// Base Unicode codepoint for each family
const BASE_CODEPOINT = 0xE900;

/**
 * Unzip the provided ZIP_FILE into TEMP_DIR.
 */
async function unzipSvgZip() {
  console.log('Extracting svg.zip...');
  
  // Check if ZIP_FILE exists
  if (!await fs.pathExists(ZIP_FILE)) {
    console.error(`Error: ${ZIP_FILE} not found. Please place svg.zip in the input directory.`);
    throw new Error('SVG zip file not found');
  }
  
  await fs.remove(TEMP_DIR);
  await fs.ensureDir(TEMP_DIR);
  
  const zip = new AdmZip(ZIP_FILE);
  zip.extractAllTo(TEMP_DIR, true);
  console.log('Extraction complete.');
  
  // List extracted files for debugging
  const extractedFiles = await fs.readdir(TEMP_DIR);
  console.log(`Extracted ${extractedFiles.length} items at root level:`);
  console.log(extractedFiles);
  
  // Look for the "all" directory directly or inside a "svg" directory
  let allDir = path.join(TEMP_DIR, 'all');
  
  // If "all" doesn't exist directly, check if it's inside a "svg" folder
  if (!await fs.pathExists(allDir) && extractedFiles.includes('svg')) {
    const svgDir = path.join(TEMP_DIR, 'svg');
    if (await fs.pathExists(svgDir)) {
      const svgContents = await fs.readdir(svgDir);
      console.log('Contents of svg directory:');
      console.log(svgContents);
      
      if (svgContents.includes('all')) {
        allDir = path.join(svgDir, 'all');
        const allContents = await fs.readdir(allDir);
        console.log(`Found ${allContents.length} files in svg/all directory`);
        // Log a few sample filenames to verify naming convention
        if (allContents.length > 0) {
          console.log('Sample filenames:');
          console.log(allContents.slice(0, 5));
        }
      }
    }
  }
  
  if (await fs.pathExists(allDir)) {
    console.log(`Found "all" directory at ${allDir}, organizing files by style...`);
    await organizeFilesByStyle(allDir);
  } else {
    console.error('Error: "all" directory not found in the extracted zip. Please ensure your svg.zip contains an "all" folder with SVG files.');
  }
}

/**
 * Organize files from the "all" directory into style-specific directories
 * based on directory names or filename patterns.
 */
async function organizeFilesByStyle(allDir) {
  const items = await fs.readdir(allDir);
  console.log(`Found ${items.length} items in the "all" directory`);
  
  // Create style directories
  const styleDirs = {};
  for (const group of groups) {
    for (const style of group.subStyles) {
      const styleDir = path.join(TEMP_DIR, style.style);
      await fs.ensureDir(styleDir);
      styleDirs[style.style.toLowerCase()] = styleDir;
      console.log(`Created style directory: ${styleDir}`);
    }
  }
  
  // Count files by style for debugging
  let styleCount = {
    'bold': 0,
    'linear': 0,
    'outline': 0,
    'broken': 0,
    'twotone': 0,
    'bulk': 0
  };
  
  // First, check if we have style directories instead of files with style suffixes
  const styleDirectories = ['bold', 'linear', 'outline', 'broken', 'twotone', 'bulk'];
  
  for (const item of items) {
    if (item === '.DS_Store') continue;
    
    const itemPath = path.join(allDir, item);
    const isDirectory = (await fs.stat(itemPath)).isDirectory();
    
    if (isDirectory && styleDirectories.includes(item.toLowerCase())) {
      // This is a style directory, copy all SVGs from it to the corresponding style folder
      const styleName = item.toLowerCase();
      const targetStyleName = styleName === 'outline' ? 'Outline' :
                             styleName === 'bold' ? 'Bold' :
                             styleName === 'linear' ? 'Linear' :
                             styleName === 'broken' ? 'Broken' :
                             styleName === 'twotone' ? 'TwoTone' :
                             styleName === 'bulk' ? 'Bulk' : null;
      
      if (targetStyleName) {
        const targetDir = path.join(TEMP_DIR, targetStyleName);
        const svgFiles = await fs.readdir(itemPath);
        
        console.log(`Found ${svgFiles.length} files in ${styleName} directory`);
        console.log(`First 5 files in ${styleName} directory:`, svgFiles.slice(0, 5));
        
        // Check if these are actually SVG files
        let svgCount = 0;
        for (const svgFile of svgFiles) {
          if (svgFile.endsWith('.svg')) {
            svgCount++;
            const sourcePath = path.join(itemPath, svgFile);
            const targetPath = path.join(targetDir, svgFile);
            await fs.copy(sourcePath, targetPath);
            styleCount[styleName]++;
          }
        }
        console.log(`Copied ${svgCount} SVG files from ${styleName} directory`);
      }
    } else if (!isDirectory && item.endsWith('.svg')) {
      // This is an SVG file with style suffix in the filename
      let detectedStyle = null;
      
      if (item.includes('-bold')) {
        detectedStyle = 'Bold';
        styleCount.bold++;
      } else if (item.includes('-linear')) {
        detectedStyle = 'Linear';
        styleCount.linear++;
      } else if (item.includes('-outline')) {
        detectedStyle = 'Outline';
        styleCount.outline++;
      } else if (item.includes('-broken')) {
        detectedStyle = 'Broken';
        styleCount.broken++;
      } else if (item.includes('-bulk')) {
        detectedStyle = 'Bulk';
        styleCount.bulk++;
      } else if (item.includes('-twotone')) {
        detectedStyle = 'TwoTone';
        styleCount.twotone++;
      }
      
      if (detectedStyle) {
        const targetDir = path.join(TEMP_DIR, detectedStyle);
        const targetFile = path.join(targetDir, 
          // Remove style suffix from filename
          item.replace(`-${detectedStyle.toLowerCase()}`, '')
        );
        await fs.copy(itemPath, targetFile);
      } else {
        console.warn(`Could not determine style for file: ${item}`);
      }
    }
  }
  
  // Log style counts
  console.log('Files organized by style:');
  console.log(styleCount);
}

/**
 * Given a folder containing SVG files, generate a mapping object:
 * { iconName: codepoint, ... }
 * Codepoints are assigned sequentially starting from baseCodepoint.
 * Files are sorted alphabetically to ensure consistent ordering.
 */
async function generateMappingFromFolder(folderPath, baseCodepoint) {
  const mapping = {};
  
  if (!await fs.pathExists(folderPath)) {
    console.warn(`Warning: Folder ${folderPath} does not exist`);
    return mapping;
  }
  
  const files = await fs.readdir(folderPath);
  // Only include .svg files.
  const svgFiles = files.filter(f => path.extname(f).toLowerCase() === '.svg').sort();
  let code = baseCodepoint;
  svgFiles.forEach(file => {
    const iconName = path.basename(file, '.svg')
      // Remove any style suffixes if they still exist
      .replace(/-bold$/i, '')
      .replace(/-linear$/i, '')
      .replace(/-outline$/i, '')
      .replace(/-broken$/i, '')
      .replace(/-bulk$/i, '')
      .replace(/-twotone$/i, '');
    
    mapping[iconName] = code;
    code++;
  });
  return mapping;
}

/**
 * Generate a font for a specific style.
 */
async function generateFontForStyle(style, files, codepoints) {
  const fontName = style.outPrefix;
  const outputPath = path.join(OUTPUT_DIR, fontName);
  
  console.log(`Generating font for ${style.style} style (${fontName})...`);
  console.log(`Found ${files.length} SVG files for this style`);
  
  if (files.length === 0) {
    console.warn(`No SVG files found for ${style.style} style, skipping`);
    return;
  }
  
  // Log the first few files for debugging
  console.log('Sample files:', files.slice(0, 3));
  
  // Generate the font
  return new Promise((resolve, reject) => {
    // Log the current working directory and output directory
    console.log(`Current working directory: ${process.cwd()}`);
    console.log(`Output directory: ${OUTPUT_DIR}`);
    
    // Make sure the output directory exists
    fs.ensureDirSync(OUTPUT_DIR);
    
    // Set options for webfonts-generator
    const options = {
      files: files,
      dest: OUTPUT_DIR,
      fontName: fontName,
      types: ['ttf', 'woff', 'woff2', 'eot', 'svg'],
      fontHeight: 1000,
      normalize: true,
      fontWeight: style.weight,
      centerHorizontally: true,
      round: 1000,
      codepoints: codepoints,
      templateOptions: {
        baseSelector: `.${style.cssPrefix}`,
        classPrefix: `${style.cssPrefix}-`
      },
      writeFiles: true,
      callback: (error, result) => {
        if (error) {
          console.error(`Error generating font for ${style.style} style:`, error);
          reject(error);
          return;
        }
        
        console.log(`Successfully generated font for ${style.style} style`);
        
        // Verify the font files were generated
        const expectedFiles = [
          `${fontName}.ttf`,
          `${fontName}.woff`,
          `${fontName}.woff2`,
          `${fontName}.eot`,
          `${fontName}.svg`
        ];
        
        let allFilesExist = true;
        for (const file of expectedFiles) {
          const filePath = path.join(OUTPUT_DIR, file);
          if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            console.log(`Generated file: ${file} (${stats.size} bytes)`);
          } else {
            console.warn(`Warning: Expected file ${file} was not generated!`);
            allFilesExist = false;
          }
        }
        
        if (allFilesExist) {
          resolve(result);
        } else {
          reject(new Error(`Some expected files for ${style.style} style were not generated`));
        }
      }
    };
    
    // Call webfonts-generator
    console.log(`Calling webfonts-generator for ${style.style} style...`);
    webfontsGenerator(options);
    
    // Add a timeout to prevent hanging
    const timeoutMs = 60000; // 1 minute timeout
    const timeout = setTimeout(() => {
      console.error(`Timeout (${timeoutMs}ms) reached while generating ${style.style} font`);
      reject(new Error(`Timeout generating ${style.style} font`));
    }, timeoutMs);
    
    // Clear the timeout when the promise resolves or rejects
    const clearTimeoutWrapper = (fn) => (...args) => {
      clearTimeout(timeout);
      return fn(...args);
    };
    
    resolve = clearTimeoutWrapper(resolve);
    reject = clearTimeoutWrapper(reject);
  });
}

/**
 * Generate font files for a given style group
 */
async function generateFontsForSubStyle(groupFamily, subStyle, mapping) {
  const styleFolder = path.join(TEMP_DIR, subStyle.style);
  
  if (!await fs.pathExists(styleFolder)) {
    console.warn(`Warning: Style folder ${styleFolder} does not exist, skipping font generation for ${subStyle.style}`);
    return;
  }
  
  // Get all SVG file paths in this folder.
  const files = (await fs.readdir(styleFolder))
    .filter(f => path.extname(f).toLowerCase() === '.svg')
    .map(f => path.join(styleFolder, f));
  
  if (files.length === 0) {
    console.warn(`Warning: No SVG files found in ${styleFolder}, skipping font generation for ${subStyle.style}`);
    return;
  }
  
  // Create ligature mapping (name -> name)
  const ligatureNameMap = {};
  Object.keys(mapping).forEach(iconName => {
    ligatureNameMap[iconName] = iconName;
  });

  // Options for webfonts-generator.
  const options = {
    files,
    dest: OUTPUT_DIR,
    fontName: groupFamily, // all share the same family name (for main group)
    types: ['eot', 'woff', 'woff2', 'svg', 'ttf'],
    // Use the provided mapping: keys are file base names and values are codepoints (numbers)
    codepoints: mapping,
    // Set custom output filename prefix. This will result in files like: outPrefix.ttf, etc.
    outFilename: subStyle.outPrefix,
    // We can generate CSS but we will merge our CSS later.
    css: false,
    templateOptions: {
      classPrefix: subStyle.cssPrefix + ' saxi-',
      baseSelector: '.saxi'
    },
    // We pass our desired font weight via the "cssTemplateOptions" (this is used by some templates).
    cssTemplateOptions: {
      fontWeight: subStyle.weight,
      fontFamily: groupFamily
    },
    // Enable ligature support
    ligatures: true,
    ligatureNameMap: ligatureNameMap
  };

  console.log(`Generating font for ${groupFamily} - ${subStyle.style} (weight ${subStyle.weight})...`);
  await generateFontForStyle(subStyle, files, mapping);
  console.log(`Generated font for ${groupFamily} - ${subStyle.style}.`);
}

/**
 * Generate a combined CSS file
 */
async function generateCSSAndJSON(group, mapping) {
  let cssLines = [];
  // Generate @font-face rules for each sub-style.
  group.subStyles.forEach(sub => {
    // Build src: list the different font formats.
    // Here we assume the generated files are named with outFilename as prefix.
    const formats = [
      `url("${sub.outPrefix}.eot") format("embedded-opentype")`,
      `url("${sub.outPrefix}.woff2") format("woff2")`,
      `url("${sub.outPrefix}.woff") format("woff")`,
      `url("${sub.outPrefix}.ttf") format("truetype")`,
      `url("${sub.outPrefix}.svg#${group.family}") format("svg")`
    ];
    cssLines.push(`@font-face {`);
    cssLines.push(`  font-family: '${group.family}';`);
    cssLines.push(`  src: ${formats.join(",\n       ")};`);
    cssLines.push(`  font-weight: ${sub.weight};`);
    cssLines.push(`  font-style: normal !important;`);
    cssLines.push(`  font-display: block;`);
    cssLines.push(`}\n`);
  });

  // Base icon class.
  cssLines.push(`.saxi {`);
  cssLines.push(`  font-family: '${group.family}' !important;`);
  cssLines.push(`  speak: never;`);
  cssLines.push(`  font-style: normal !important;`);
  cssLines.push(`  font-weight: normal;`);
  cssLines.push(`  font-variant: normal;`);
  cssLines.push(`  text-transform: none;`);
  cssLines.push(`  line-height: 1;`);
  cssLines.push(`  -webkit-font-smoothing: antialiased;`);
  cssLines.push(`  -moz-osx-font-smoothing: grayscale;`);
  // Add ligature support
  cssLines.push(`  -webkit-font-feature-settings: "liga";`);
  cssLines.push(`  -moz-font-feature-settings: "liga=1";`);
  cssLines.push(`  -moz-font-feature-settings: "liga";`);
  cssLines.push(`  -ms-font-feature-settings: "liga" 1;`);
  cssLines.push(`  font-feature-settings: "liga";`);
  cssLines.push(`  text-rendering: optimizeLegibility;`);
  cssLines.push(`}\n`);

  // Style variant classes
  group.subStyles.forEach(sub => {
    cssLines.push(`.${sub.cssPrefix} {`);
    cssLines.push(`  font-family: '${group.family}';`);
    cssLines.push(`  font-weight: ${sub.weight};`);
    cssLines.push(`}\n`);
  });

  // Generate icon classes.
  Object.keys(mapping).forEach(iconName => {
    // Convert the codepoint number to a hex string (e.g. E91B) padded to 4 digits.
    const hex = mapping[iconName].toString(16).toUpperCase();
    cssLines.push(`.saxi-${iconName}:before {`);
    cssLines.push(`  content: "\\${hex}";`);
    cssLines.push(`}\n`);
  });

  // Write the CSS file.
  const cssFilename = path.join(OUTPUT_DIR, `${group.family}.css`);
  await fs.writeFile(cssFilename, cssLines.join('\n'));
  console.log(`Generated CSS file: ${cssFilename}`);

  // Write the JSON mapping.
  const jsonFilename = path.join(OUTPUT_DIR, group.mappingFile);
  // Convert codepoints to hex strings.
  const jsonMapping = {};
  Object.keys(mapping).forEach(key => {
    jsonMapping[key] = mapping[key].toString(16).toUpperCase();
  });
  await fs.writeJson(jsonFilename, jsonMapping, { spaces: 2 });
  console.log(`Generated JSON mapping: ${jsonFilename}`);
}

/**
 * Generate a combined CSS file for all font families
 */
async function generateCombinedCSS() {
  console.log('\nGenerating combined CSS file...');
  
  try {
    const files = await fs.readdir(OUTPUT_DIR);
    const cssFiles = files.filter(f => f.endsWith('.css') && f !== 'saxi-icons-all.css');
    
    let combinedContent = '/* Combined SAXI Icons CSS */\n\n';
    
    for (const cssFile of cssFiles) {
      const cssPath = path.join(OUTPUT_DIR, cssFile);
      let cssContent = await fs.readFile(cssPath, 'utf8');
      
      // Ensure font URLs are relative and don't have quotes
      cssContent = cssContent.replace(/url\(['"]?(.*?)['"]?\)/g, (match, url) => {
        return `url(${path.basename(url)})`;
      });
      
      // Add !important to font-style properties
      cssContent = cssContent.replace(/font-style:\s*normal;/g, 'font-style: normal !important;');
      
      combinedContent += `/* ${cssFile} */\n${cssContent}\n\n`;
    }
    
    // Add utility classes for consistent usage
    combinedContent += `/* Utility Classes */
.saxi {
  font-family: 'saxi-icons-pro' !important;
  font-style: normal !important;
  speak: never;
  font-variant: normal;
  text-transform: none;
  line-height: 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Font-weight utilities */
.saxi-bold, .saxi-solid {
  font-weight: 700 !important;
}

.saxi-regular, .saxi-linear, .saxi-broken, .saxi-twotone {
  font-weight: 400 !important;
}

.saxi-light, .saxi-outline {
  font-weight: 300 !important;
}

.saxi-bulk {
  font-weight: 700 !important;
  font-family: 'saxi-icons-pro-twotone' !important;
}

/* Ensure all icons have the correct baseline */
[class^="saxi-"], [class*=" saxi-"] {
  font-style: normal !important;
  line-height: 1;
}
`;
    
    const combinedPath = path.join(OUTPUT_DIR, 'saxi-icons-all.css');
    await fs.writeFile(combinedPath, combinedContent);
    console.log('Created combined CSS file: saxi-icons-all.css');
  } catch (error) {
    console.error('Error generating combined CSS:', error);
  }
}

/**
 * Fix font paths in CSS files to ensure they're correctly referenced.
 */
async function fixFontPaths() {
  console.log('Fixing font paths in CSS files...');
  
  // Get all CSS files in the output directory
  const files = await fs.readdir(OUTPUT_DIR);
  const cssFiles = files.filter(f => f.endsWith('.css'));
  
  for (const cssFile of cssFiles) {
    const cssPath = path.join(OUTPUT_DIR, cssFile);
    let cssContent = await fs.readFile(cssPath, 'utf8');
    
    // Fix font paths - make them relative to the CSS file
    cssContent = cssContent.replace(/url\(['"]?([^'")]+)['"]?\)/g, (match, p1) => {
      // Get just the filename without path
      const filename = path.basename(p1);
      return `url('${filename}')`;
    });
    
    // Ensure the font-family names are consistent
    if (cssFile.includes('saxi-icons-pro-bold') || 
        cssFile.includes('saxi-icons-pro-linear') || 
        cssFile.includes('saxi-icons-pro-outline') || 
        cssFile.includes('saxi-icons-pro-broken')) {
      cssContent = cssContent.replace(/font-family: ['"]?([^'";]+)['"]?/g, 
        `font-family: 'saxi-icons-pro'`);
    } else if (cssFile.includes('saxi-icons-pro-twotone') || 
               cssFile.includes('saxi-icons-pro-bulk')) {
      cssContent = cssContent.replace(/font-family: ['"]?([^'";]+)['"]?/g, 
        `font-family: 'saxi-icons-pro-twotone'`);
    }
    
    await fs.writeFile(cssPath, cssContent);
    console.log(`Fixed paths in ${cssFile}`);
  }
  
  // Now create a combined CSS file
  await createCombinedCss();
}

/**
 * Create a combined CSS file with all styles.
 */
async function createCombinedCss() {
  console.log('Creating combined CSS file...');
  
  const files = await fs.readdir(OUTPUT_DIR);
  const cssFiles = files.filter(f => f.endsWith('.css') && !f.includes('all'));
  
  let combinedContent = '/* Combined SAXI Icons CSS */\n\n';
  
  for (const cssFile of cssFiles) {
    const cssPath = path.join(OUTPUT_DIR, cssFile);
    const cssContent = await fs.readFile(cssPath, 'utf8');
    combinedContent += `/* ${cssFile} */\n${cssContent}\n\n`;
  }
  
  const combinedPath = path.join(OUTPUT_DIR, 'saxi-icons-all.css');
  await fs.writeFile(combinedPath, combinedContent);
  console.log('Created combined CSS file: saxi-icons-all.css');
}

/**
 * List all files in the output directory for debugging.
 */
async function listGeneratedFiles() {
  console.log('\n--- Generated Files ---');
  
  const files = await fs.readdir(OUTPUT_DIR);
  files.sort();
  
  for (const file of files) {
    const filePath = path.join(OUTPUT_DIR, file);
    const stats = await fs.stat(filePath);
    console.log(`${file} (${formatFileSize(stats.size)})`);
  }
  
  console.log('------------------------\n');
}

/**
 * Format file size in a human-readable format.
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Main build function to generate all icon fonts
 */
async function buildIconFont() {
  try {
    console.log('Starting icon font build process...');
    
    // Extract SVG files from ZIP
    await unzipSvgZip();
    
    console.log('\n=== Starting font generation for all styles ===');
    
    // Process each group separately and ensure completion
    for (const group of groups) {
      console.log(`\n=== Processing ${group.family} group ===`);
      
      // Create shared codepoints mapping
      const codepoints = {};
      let nextCodepoint = BASE_CODEPOINT;
      
      // First pass: assign codepoints to all icons in this group
      for (const style of group.subStyles) {
        const styleDir = path.join(TEMP_DIR, style.style);
        if (await fs.pathExists(styleDir)) {
          const files = await fs.readdir(styleDir);
          const svgFiles = files.filter(f => f.endsWith('.svg'));
          
          // Assign codepoints to icons if not already assigned
          for (const file of svgFiles) {
            const iconName = path.basename(file, '.svg');
            if (!codepoints[iconName]) {
              codepoints[iconName] = nextCodepoint++;
            }
          }
        }
      }
      
      console.log(`Assigned codepoints for ${Object.keys(codepoints).length} icons in ${group.family}`);
      
      // Second pass: generate font for each style using the shared codepoints
      for (const style of group.subStyles) {
        const styleDir = path.join(TEMP_DIR, style.style);
        if (await fs.pathExists(styleDir)) {
          const files = await fs.readdir(styleDir);
          const svgFiles = files.filter(f => f.endsWith('.svg'));
          const svgPaths = svgFiles.map(f => path.join(styleDir, f));
          
          console.log(`\nGenerating ${style.style} font with ${svgPaths.length} icons...`);
          
          try {
            await generateFontForStyle(style, svgPaths, codepoints);
            console.log(`✅ Successfully generated ${style.style} font`);
          } catch (error) {
            console.error(`❌ Error generating ${style.style} font:`, error);
          }
        }
      }
      
      // Save mapping file
      const mappingPath = path.join(OUTPUT_DIR, group.mappingFile);
      await fs.writeJson(mappingPath, codepoints, { spaces: 2 });
      console.log(`Saved codepoint mapping to ${group.mappingFile}`);
    }
    
    // Create a combined CSS file
    await generateCombinedCSS();
    
    // List all generated files for verification
    await listGeneratedFiles();
    
    console.log('\n=== Font generation completed successfully! ===');
    return true;
  } catch (error) {
    console.error('Error building icon font:', error);
    return false;
  } finally {
    // Don't clean up the temp directory yet for debugging
    // await fs.remove(TEMP_DIR);
    console.log('Note: Keeping temp directory for debugging');
  }
}

if (require.main === module) {
  // This means the script was run directly with node
  buildIconFont()
    .then(() => {
      console.log('Icon font build completed successfully!');
    })
    .catch(error => {
      console.error('Error building icon font:', error);
      process.exit(1);
    });
} else {
  // The script was required as a module
  module.exports = buildIconFont;
}