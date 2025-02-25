/**
 * clean.js
 * 
 * Cleans up temporary files and directories created during the build process.
 * Optionally can clean the output directory as well.
 */

const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');

// Directories to clean
const TEMP_DIRS = [
  'temp_svgs'
];

// Files to clean
const TEMP_FILES = [
  'svg.zip'
];

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function cleanTempFiles() {
  try {
    console.log('Cleaning temporary files and directories...');
    
    // Remove temporary directories
    for (const dir of TEMP_DIRS) {
      const dirPath = path.join(__dirname, '..', dir);
      if (await fs.pathExists(dirPath)) {
        await fs.remove(dirPath);
        console.log(`Removed: ${dir}/`);
      }
    }
    
    // Remove temporary files
    for (const file of TEMP_FILES) {
      const filePath = path.join(__dirname, '..', file);
      if (await fs.pathExists(filePath)) {
        await fs.remove(filePath);
        console.log(`Removed: ${file}`);
      }
    }
    
    console.log('Temporary files cleaned successfully!');
  } catch (error) {
    console.error('Error cleaning temporary files:', error);
  }
}

async function cleanOutputDirectory() {
  try {
    const outputDir = path.join(__dirname, '..', 'Fonts');
    
    if (await fs.pathExists(outputDir)) {
      await fs.emptyDir(outputDir);
      console.log('Cleaned output directory: Fonts/');
    }
  } catch (error) {
    console.error('Error cleaning output directory:', error);
  }
}

function askForOutputCleaning() {
  rl.question('Do you want to clean the output directory (Fonts/) as well? (y/N): ', async (answer) => {
    if (answer.toLowerCase() === 'y') {
      await cleanOutputDirectory();
    }
    
    rl.close();
    console.log('\nCleanup completed!');
  });
}

async function clean() {
  await cleanTempFiles();
  askForOutputCleaning();
}

clean();