import fs from 'fs';
import path from 'path';

function findReactErrors(dir: string) {
  const dirFiles = fs.readdirSync(dir);
  for (const file of dirFiles) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findReactErrors(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('React.') && !content.includes('import React')) {
         console.log(`Missing React in: ${fullPath}`);
      }
    }
  }
}

findReactErrors('./src');
