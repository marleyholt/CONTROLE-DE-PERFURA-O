const fs = require('fs');
const text = fs.readFileSync('run.cjs', 'utf-8');
const lines = text.split('\n');
const s = new Set();
for(let l of lines) {
  if (l.includes('MD ') || l.includes('VT ') || l.includes('ME ')) {
    let parts = l.trim().split(/\s+/);
    s.add(parts[1]);
  }
}
console.log(s.size);
