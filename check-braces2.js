const fs = require('fs');
const path = 'C:\\Users\\HP\\Downloads\\Telegram Desktop\\Smart-Cafeteria-Ordering-System\\Smart-Cafeteria-Ordering-System\\Frontend\\src\\js\\admin-feedback.js';
const content = fs.readFileSync(path, 'utf8');

let braces = 0, parens = 0;
let inString = false, stringChar = '';
const lines = content.split('\n');
lines.forEach((line, i) => {
  let inStr = false, strChar = '';
  for (let ch of line) {
    if (!inStr) {
      if (ch === '"' || ch === "'") { inStr = true; strChar = ch; }
      else if (ch === '{') braces++;
      else if (ch === '}') braces--;
      else if (ch === '(') parens++;
      else if (ch === ')') parens--;
    } else if (ch === stringChar && line[line.indexOf(ch)-1] !== '\\') {
      // simplified
    }
  }
  // Just count braces in line naively for now
  const openB = (line.match(/{/g) || []).length;
  const closeB = (line.match(/}/g) || []).length;
  const openP = (line.match(/\(/g) || []).length;
  const closeP = (line.match(/\)/g) || []).length;
  // This is naive but gives us a rough idea
  console.log(i+1, 'braces diff:', openB - closeB, 'parens diff:', openP - closeP, '|', line.trim().substring(0, 60));
});