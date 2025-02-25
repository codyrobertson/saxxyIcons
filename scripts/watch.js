/**
 * watch.js
 * 
 * Watches the input directory for changes to svg.zip and automatically
 * rebuilds the icon font when changes are detected.
 */

const chokidar = require('chokidar');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs-extra');

// Path to watch
const inputDir = path.join(__dirname, '..', 'input');
const svgZipPath = path.join(inputDir, 'svg.zip');

// Debounce function to prevent multiple builds
let buildTimeout = null;
const DEBOUNCE_TIME = 1000; // 1 second

function debounce(func) {
  clearTimeout(buildTimeout);
  buildTimeout = setTimeout(func, DEBOUNCE_TIME);
}

async function runBuild() {
  console.log('\n-------------------------------------');
  console.log(`Change detected at ${new Date().toLocaleTimeString()}`);
  console.log('Starting build process...');
  
  const buildProcess = spawn('node', [path.join(__dirname, 'build.js')], {
    stdio: 'inherit',
    shell: true
  });
  
  buildProcess.on('error', (error) => {
    console.error('Error running build:', error);
  });
}

async function startWatcher() {
  try {
    console.log('Starting watch mode...');
    console.log(`Watching for changes to ${svgZipPath}`);
    console.log('Press Ctrl+C to stop');
    
    // Check if input directory exists
    if (!await fs.pathExists(inputDir)) {
      console.log('Input directory not found, creating it...');
      await fs.ensureDir(inputDir);
    }
    
    // Initialize watcher
    const watcher = chokidar.watch(svgZipPath, {
      persistent: true,
      ignoreInitial: false,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
      }
    });
    
    // File added/changed
    watcher.on('add', (path) => {
      console.log(`svg.zip added at ${path}`);
      debounce(runBuild);
    });
    
    watcher.on('change', (path) => {
      console.log(`svg.zip changed at ${path}`);
      debounce(runBuild);
    });
    
    // File deleted
    watcher.on('unlink', (path) => {
      console.log(`svg.zip removed at ${path}`);
    });
    
    // Error handling
    watcher.on('error', (error) => {
      console.error(`Watcher error: ${error}`);
    });
    
    // Log when watcher is ready
    watcher.on('ready', () => {
      console.log('Initial scan complete. Ready for changes');
    });
    
  } catch (error) {
    console.error('Error in watch mode:', error);
  }
}

startWatcher();