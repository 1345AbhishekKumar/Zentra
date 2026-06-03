const fs = require('fs');
const path = require('path');

const MIN_LINES = 10; // Find duplicates of 10 or more lines

function getFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.expo' && file !== '.git') {
        getFiles(fullPath, files);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

const allFiles = getFiles(path.join(__dirname, '..', 'src'));
console.log(`Found ${allFiles.length} files to check.`);

// Helper to normalize a line for comparison
const normalize = (line) => line.trim().replace(/\s+/g, ' ');

const fileLines = {};
const fileOriginalLines = {};

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  fileOriginalLines[file] = lines;
  fileLines[file] = lines.map(normalize);
}

const duplicates = [];

// Compare all file pairs (including self-comparison for internal duplicates, excluding identical lines/ranges)
for (let i = 0; i < allFiles.length; i++) {
  const fileA = allFiles[i];
  const linesA = fileLines[fileA];
  
  for (let j = i; j < allFiles.length; j++) {
    const fileB = allFiles[j];
    const linesB = fileLines[fileB];
    
    // We match lines
    let pA = 0;
    while (pA < linesA.length) {
      if (!linesA[pA]) {
        pA++;
        continue;
      }
      
      let pB = (fileA === fileB) ? pA + 1 : 0;
      while (pB < linesB.length) {
        if (!linesB[pB]) {
          pB++;
          continue;
        }
        
        let len = 0;
        while (
          pA + len < linesA.length &&
          pB + len < linesB.length &&
          linesA[pA + len] &&
          linesB[pB + len] &&
          linesA[pA + len] === linesB[pB + len]
        ) {
          len++;
        }
        
        if (len >= MIN_LINES) {
          // Check if this duplicate is already a sub-range of an already found duplicate
          const isSubrange = duplicates.some(d => 
            d.fileA === fileA && d.fileB === fileB &&
            pA >= d.startA && pA + len <= d.startA + d.length &&
            pB >= d.startB && pB + len <= d.startB + d.length
          );
          
          if (!isSubrange) {
            duplicates.push({
              fileA,
              startA: pA,
              fileB,
              startB: pB,
              length: len,
              snippet: fileOriginalLines[fileA].slice(pA, pA + 5).join('\n') + '\n...'
            });
          }
          pB += len;
        } else {
          pB++;
        }
      }
      pA++;
    }
  }
}

// Group duplicate instances to reduce noise
console.log(`\nFound ${duplicates.length} duplicate blocks:\n`);
duplicates.sort((a, b) => b.length - a.length);

duplicates.forEach((dup, index) => {
  const relA = path.relative(path.join(__dirname, '..'), dup.fileA);
  const relB = path.relative(path.join(__dirname, '..'), dup.fileB);
  console.log(`[${index + 1}] Duplication of ${dup.length} lines:`);
  console.log(`    - File A: ${relA}:${dup.startA + 1}`);
  console.log(`    - File B: ${relB}:${dup.startB + 1}`);
  console.log(`  Preview:`);
  console.log(`  """`);
  console.log(dup.snippet);
  console.log(`  """\n`);
});
