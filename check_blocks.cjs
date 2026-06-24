const fs = require('fs');
const runText = fs.readFileSync('run.cjs', 'utf-8');
const runLines = runText.split('\n');
let holes = [];
for (let l of runLines) {
    if (l.includes('MD ') || l.includes('VT ') || l.includes('ME ')) {
        holes.push(l.trim().split(/\s+/)[1]);
    }
}
let bpByBlock = {};
let bsByBlock = {};
for (let h of holes) {
    let match = h.match(/^([0-9]+)B([0-9]+)([PS])$/);
    if (!match) match = h.match(/^([0-9]+)B([0-9]+)?([PS])$/);
    if (match) {
        let block = parseInt(match[1]);
        let type = match[3];
        if (type === 'P') bpByBlock[block] = (bpByBlock[block] || 0) + 1;
        if (type === 'S') bsByBlock[block] = (bsByBlock[block] || 0) + 1;
    }
}
for (let b = 1; b <= 22; b++) {
    let p = bpByBlock[b] || 0;
    let s = bsByBlock[b] || 0;
    if (p !== s && !(p===0 && s===0)) {
        console.log(`Block ${b}: BP=${p}, BS=${s}`);
    }
}
