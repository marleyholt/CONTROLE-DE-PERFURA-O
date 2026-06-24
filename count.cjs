const fs = require('fs');
const text = fs.readFileSync('run.cjs', 'utf-8');
const lines = text.split('\n');
let count = 0;
for(let l of lines) if (l.includes('MD') || l.includes('VT') || l.includes('ME')) count++;
console.log(count);
