const fs = require('fs');
const path = 'C:\\Users\\HP\\Downloads\\Telegram Desktop\\Smart-Cafeteria-Ordering-System\\Smart-Cafeteria-Ordering-System\\Frontend\\src\\js\\admin-api.js';
let c = fs.readFileSync(path, 'utf8');
c = c.replace(/\.replace\("\/"\//g, '.replace(/"/g, """)');
c = c.replace(/\.replace\(\'/g, '.replace(/\'/g, "'")');
fs.writeFileSync(path, c, 'utf8');
console.log('ok');