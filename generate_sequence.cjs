const fs = require('fs');

const runText = fs.readFileSync('run.cjs', 'utf-8');
const lines = runText.split('\n').filter(l => l.trim().length > 0);

let allHoles = [];

for (const line of lines) {
  const parts = line.trim().split(/\s+/);
  if (parts.length >= 6) {
    let rawId = parts[1];
    
    let match = rawId.match(/^([0-9]+)([A-E])([0-9]+)?([PS])$/);
    if (!match) continue;
    
    let depth = parseFloat(parts[2].replace(',', '.'));
    let location = parts[4]; // MD, VT, ME
    let block = parseInt(parts[5]);
    
    let lineLetter = match[2];
    let isPrimary = match[4] === 'P';
    
    let cat = 0;
    if (lineLetter === 'A' && isPrimary) cat = 1;
    else if (lineLetter === 'A' && !isPrimary) cat = 2;
    else if (lineLetter === 'B' && isPrimary) cat = 3;
    else if (lineLetter === 'B' && !isPrimary) cat = 4;
    else if (['C', 'D', 'E'].includes(lineLetter) && isPrimary) cat = 5;
    else if (['C', 'D', 'E'].includes(lineLetter) && !isPrimary) cat = 6;

    allHoles.push({
        id: rawId,
        depth,
        block,
        location,
        line: lineLetter,
        isPrimary,
        typeSuffix: match[4],
        cat
    });
  }
}

const blockOrders = {
  'MD': [13, 12, 11, 10, 9, 8, 7, 6, 5],
  'VT': [4, 3, 2, 1, 16, 15, 14],
  'ME': [19, 18, 17, 22, 21, 20]
};

function getBlockIndex(loc, block) {
  const order = blockOrders[loc];
  if (order) {
    let idx = order.indexOf(block);
    return idx !== -1 ? idx : 999;
  }
  return block;
}

let sequencedHoles = [];

for (const loc of ['MD', 'VT', 'ME']) {
  let locHoles = allHoles.filter(h => h.location === loc);
  let seqNum = 1;

  for (let cat = 1; cat <= 6; cat++) {
    let catHoles = locHoles.filter(h => h.cat === cat);
    
    while (catHoles.length > 0) {
      catHoles.sort((a, b) => getBlockIndex(loc, a.block) - getBlockIndex(loc, b.block));
      
      let sweepIndices = [];
      let lastBlockIdx = null;
      
      for (let i = 0; i < catHoles.length; i++) {
        let currentBlockIdx = getBlockIndex(loc, catHoles[i].block);
        if (lastBlockIdx === null || Math.abs(currentBlockIdx - lastBlockIdx) >= 3) {
          sweepIndices.push(i);
          lastBlockIdx = currentBlockIdx;
        }
      }
      
      if (sweepIndices.length === 0) {
        sweepIndices.push(0);
      }
      
      let selectedItems = sweepIndices.map(idx => catHoles[idx]);
      
      sweepIndices.reverse();
      for (let idx of sweepIndices) {
        catHoles.splice(idx, 1);
      }
      
      for (let selected of selectedItems) {
        let numMatches = selected.id.match(/\d+/g);
        let num = numMatches ? numMatches[1] : selected.id;
        let nameString = "Furo " + num + " - Linha " + selected.line + " - " + (selected.isPrimary ? 'Primário' : 'Secundário');
        
        sequencedHoles.push({
          seq: seqNum.toString().padStart(3, '0'),
          id: selected.id,
          name: nameString,
          depth: selected.depth,
          cement: selected.depth * 40,
          location: selected.location,
          block: selected.block.toString(),
          status: 'PENDING'
        });
        seqNum++;
      }
    }
  }
}

let outputTs = "import { Hole } from './types';\n\nexport const initialHoles: Hole[] = [\n";
for (const h of sequencedHoles) {
  outputTs += `  { seq: '${h.seq}', id: '${h.id}', name: '${h.name}', depth: ${h.depth}, cement: ${h.cement}, location: '${h.location}', block: '${h.block}', status: '${h.status}' },\n`;
}
outputTs += "];\n";

fs.writeFileSync('src/data.ts', outputTs);
console.log("Generated " + sequencedHoles.length + " holes with custom sweep logic");
