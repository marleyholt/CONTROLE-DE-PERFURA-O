const fs = require('fs');
const text = fs.readFileSync('run.cjs', 'utf-8');
const lines = text.split('\n');
const counts = {};
let total = 0;
for(let l of lines) {
  if (l.includes('MD ') || l.includes('VT ') || l.includes('ME ')) {
    let parts = l.trim().split(/\s+/);
    let id = parts[1];
    counts[id] = (counts[id] || 0) + 1;
    total++;
  }
}
for (let id in counts) {
  if (counts[id] > 1) console.log(id, counts[id]);
}
console.log('Total lines:', total);
