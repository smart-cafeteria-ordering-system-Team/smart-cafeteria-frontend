const fs = require('fs');
const path = 'C:\\Users\\HP\\Downloads\\Telegram Desktop\\Smart-Cafeteria-Ordering-System\\Smart-Cafeteria-Ordering-System\\Frontend\\src\\js\\admin-api.js';
const content = fs.readFileSync(path, 'utf8');

// Find the esc function and replace the entire thing with correct entities
const escFunction = `  function esc(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, "'");
  }`;

const newContent = content.replace(/function esc\(value\) \{[\s\S]*?\n  \}/, escFunction);

fs.writeFileSync(path, newContent, 'utf8');
console.log('fixed');