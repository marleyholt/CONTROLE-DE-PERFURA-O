const fs = require('fs');
const runText = fs.readFileSync('run.cjs', 'utf-8');
const runLines = runText.split('\n');
let holes = [];
for (let l of runLines) {
    if (l.includes('MD ') || l.includes('VT ') || l.includes('ME ')) {
        holes.push(l.trim().split(/\s+/)[1]);
    }
}
let csByBlock = {};
for (let h of holes) {
    let match = h.match(/^([0-9]+)C([0-9]+)?S$/);
    if (match) {
        let block = parseInt(match[1]);
        csByBlock[block] = (csByBlock[block] || 0) + 1;
    }
}
let cpByBlock = {};
for (let h of holes) {
    let match = h.match(/^([0-9]+)C([0-9]+)?P$/);
    if (match) {
        let block = parseInt(match[1]);
        cpByBlock[block] = (cpByBlock[block] || 0) + 1;
    }
}

for (let b = 1; b <= 22; b++) {
    let p = cpByBlock[b] || 0;
    let s = csByBlock[b] || 0;
    console.log(`Block ${b}: CP=${p}, CS=${s}`);
}
