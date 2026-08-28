const fs = require('fs');
const path = 'C:\\Users\\HP\\Downloads\\Telegram Desktop\\Smart-Cafeteria-Ordering-System\\Smart-Cafeteria-Ordering-System\\Frontend\\src\\js\\admin-api.js';
let content = fs.readFileSync(path, 'utf8');

// The issue is that PowerShell converts ' to ' which is the HTML entity for '
// We need to replace the literal string .replace(/'/g, '') with .replace(/'/g, "'")
content = content.replace(/\.replace\(\/'\/g, \"\"\)/g, '.replace(/\'/g, "\'")');
content = content.replace(/\.replace\(\/"\/g, \"\"\)/g, '.replace(/"/g, "&")');

fs.writeFileSync(path, content, 'utf8');
console.log('fixed');