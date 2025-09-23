#!/usr/bin/env node

/**
 * Simple script to convert className to class in Astro files
 * This addresses the common issue where JSX className is used in Astro templates
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

function fixClassNames(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Replace className with class in HTML/Astro templates
  const classNameRegex = /\bclassName=/g;
  if (classNameRegex.test(content)) {
    content = content.replace(classNameRegex, 'class=');
    changed = true;
  }

  // Convert HTML comments to JSX comments inside JSX expressions
  // This regex looks for <!-- comment --> inside JSX expressions
  const htmlCommentInJSX = /(\{[^}]*?)<!--\s*(.*?)\s*-->([^}]*?\})/g;
  if (htmlCommentInJSX.test(content)) {
    content = content.replace(htmlCommentInJSX, '$1{/* $2 */}$3');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${filePath}`);
  } else {
    console.log(`✨ Clean: ${filePath}`);
  }
}

// Find all Astro files
const astroFiles = glob.sync('apps/web/src/**/*.astro');

console.log(`🔍 Found ${astroFiles.length} Astro files`);
console.log('🔧 Converting className to class...\n');

astroFiles.forEach(fixClassNames);

console.log('\n✅ Astro className conversion complete!');
