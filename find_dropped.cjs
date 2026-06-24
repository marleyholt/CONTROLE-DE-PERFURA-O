const fs = require('fs');
const text = fs.readFileSync('run.cjs', 'utf-8');
const lines = text.split('\n');
let dropped = [];
for(let l of lines) {
  if (l.includes('MD ') || l.includes('VT ') || l.includes('ME ')) {
    let parts = l.trim().split(/\s+/);
    if (!parts[1].match(/^\d+[A-E]\d+[PS]$/)) {
      dropped.push(l);
    }
  }
}
console.log(dropped);
