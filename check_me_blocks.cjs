const fs = require('fs');
const lines = fs.readFileSync('run.cjs','utf-8').split('\n');
const m = new Set();
lines.forEach(l => {
  if (l.includes('ME ')) m.add(parseInt(l.trim().split(/\s+/)[5]));
});
console.log(Array.from(m).sort((a,b)=>a-b));
