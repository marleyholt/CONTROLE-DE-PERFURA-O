const fs = require('fs');

const rawText = fs.readFileSync('run.cjs', 'utf-8');
const lines = rawText.split('\n').filter(l => l.trim().length > 0);
const ids = new Set();
for (const line of lines) {
  const parts = line.trim().split(/\s+/);
  if (parts.length >= 6 && parts[1].match(/^\d+[A-E]\d+[PS]$/)) {
    if (ids.has(parts[1])) {
      console.log('Duplicate:', parts[1]);
    }
    ids.add(parts[1]);
  }
}
