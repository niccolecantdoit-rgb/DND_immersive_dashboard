const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const inputFile = 'dist/DND_Dashboard_Immersive.user.js';
const outputFile = 'DND_Dashboard_Immersive.min.js';

if (!fs.existsSync(inputFile)) {
    console.error(`Error: ${inputFile} not found.`);
    process.exit(1);
}

const content = fs.readFileSync(inputFile, 'utf8');

// Extract UserScript header
const headerMatch = content.match(/(\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==)/);
let header = '';
let body = content;

if (headerMatch) {
    header = headerMatch[1];
    body = content.replace(headerMatch[0], '');
}

// Temporary file for body minification
const tempBodyFile = 'temp_body.js';
const tempOutFile = 'temp_out.js';
fs.writeFileSync(tempBodyFile, body);

console.log('Attempting to minify using terser...');

try {
    // Try using npx terser
    // --compress: enable compression
    // --mangle: mangle variable names
    // --comments false: remove all comments (we add header back manually)
    execSync(`npx --yes terser ${tempBodyFile} --output ${tempOutFile} --compress --mangle --comments false`, { stdio: 'inherit' });

    if (fs.existsSync(tempOutFile)) {
        const minifiedBody = fs.readFileSync(tempOutFile, 'utf8');
        const finalContent = header + '\n' + minifiedBody;
        
        fs.writeFileSync(outputFile, finalContent);
        console.log(`\nSuccess! Minified file created at: ${outputFile}`);
        
        // Cleanup
        fs.unlinkSync(tempBodyFile);
        fs.unlinkSync(tempOutFile);
    } else {
        throw new Error('Terser output file not found.');
    }

} catch (error) {
    console.error('\nMinification failed or Terser not available.');
    console.error('Error details:', error.message);
    console.log('\nFallback: Creating a simply stripped version (WARNING: This naive method may break code if not careful).');
    
    // Cleanup temp input if exists
    if (fs.existsSync(tempBodyFile)) fs.unlinkSync(tempBodyFile);
    
    // Naive fallback - ONLY removes block comments and leading/trailing whitespace of lines
    // Does NOT remove single line comments safely or merge lines to avoid breaking code
    // Merging lines safely requires AST parsing which is complex without tools.
    // So we will just write the file as is but with trimmed lines, which is not "single line" but cleaner.
    // OR we try to remove block comments and empty lines.
    
    let stripped = body
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('//')) // Remove empty lines and full-line comments
        .join('\n'); // Keep newlines for safety in fallback mode
        
    const finalContent = header + '\n' + stripped;
    fs.writeFileSync(outputFile, finalContent);
    console.log(`Created simplified version at: ${outputFile} (Note: Not fully minified to single line for safety)`);
}