const fs = require('fs');
const path = 'C:\\Users\\HP\\Downloads\\Telegram Desktop\\Smart-Cafeteria-Ordering-System\\Smart-Cafeteria-Ordering-System\\Frontend\\src\\js\\admin-api.js';
let content = fs.readFileSync(path, 'utf8');

// Fix the entity encoding issues
content = content.replace(".replace(/'/g, '')", ".replace(/'/g, \"'\")");
content = content.replace(".replace(/\"/g, \"\")", ".replace(/\"/g, \"&\")");

fs.writeFileSync(path, content, 'utf8');
console.log('fixed');