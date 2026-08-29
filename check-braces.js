const fs = require('fs');
const path = 'C:\\Users\\HP\\Downloads\\Telegram Desktop\\Smart-Cafeteria-Ordering-System\\Smart-Cafeteria-Ordering-System\\Frontend\\src\\js\\admin-feedback.js';
const content = fs.readFileSync(path, 'utf8');

let braces = 0, parens = 0;
let inString = false, stringChar = '';
for (let i = 0; i < content.length; i++) {
  const ch = content[i];
  if (!inString) {
    if (ch === '"' || ch === "'") { inString = true; stringChar = ch; }
    else if (ch === '{') braces++;
    else if (ch === '}') braces--;
    else if (ch === '(') parens++;
    else if (ch === ')') parens--;
  } else if (ch === stringChar && content[i-1] !== '\\') {
    inString = false;
  }
}
console.log('Final braces:', braces, 'parens:', parens);