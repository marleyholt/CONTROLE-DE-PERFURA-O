const fs = require('fs');

const rawText = fs.readFileSync('run.cjs', 'utf-8');
const lines = rawText.split('\n').filter(l => l.trim().length > 0);
let count = 0;

for (const line of lines) {
  const parts = line.trim().split(/\s+/);
  if (parts.length >= 6) {
    let rawId = parts[1];
    if (rawId.match(/^\d+[A-E]\d+[PS]$/)) count++;
    else console.log("Dropped:", rawId);
  }
}
console.log("Total matching regex:", count);
