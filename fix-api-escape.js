const fs = require('fs');
const path = 'C:\\Users\\HP\\Downloads\\Telegram Desktop\\Smart-Cafeteria-Ordering-System\\Smart-Cafeteria-Ordering-System\\Frontend\\src\\js\\admin-api.js';
const content = fs.readFileSync(path, 'utf8');

// Fix the single quote entity issue - replace .replace(/'/g, "") with proper entity
const fixed = content
  .replace(/\.replace\(\/\\'/g, '\"\'\)\", ".replace(/'/g, \"'\")")
  .replace(/\.replace\(\"\\/\\/g, '\"&\"\)\", '.replace(/"/g, "&")');

fs.writeFileSync(path, fixed, 'utf8');
console.log('fixed');