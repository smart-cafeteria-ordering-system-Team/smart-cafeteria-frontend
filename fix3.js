const fs = require('fs');
const srcPath = 'C:\\Users\\HP\\Downloads\\Telegram Desktop\\Smart-Cafeteria-Ordering-System\\Smart-Cafeteria-Ordering-System\\Frontend\\src\\js\\admin-api.js';
const dstPath = 'C:\\Users\\HP\\Downloads\\Telegram Desktop\\Smart-Cafeteria-Ordering-System\\Smart-Cafeteria-Ordering-System\\Frontend\\src\\js\\admin-api.js';
let c = fs.readFileSync(srcPath, 'utf8');
c = c.replace(/.replace\("\/"\//g, '.replace(/"/g, """)');
c = c.replace(/.replace\(\'/g, '.replace(/\'/g, "'")');
fs.writeFileSync(dstPath, c, 'utf8');
console.log('ok');