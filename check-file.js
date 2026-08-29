const fs = require('fs');
const path = 'C:\\Users\\HP\\Downloads\\Telegram Desktop\\Smart-Cafeteria-Ordering-System\\Smart-Cafeteria-Ordering-System\\Frontend\\src\\js\\admin-api.js';
const c = fs.readFileSync(path, 'utf8');
const lines = c.split('\n');
lines.forEach((line, i) => {
  if (line.includes('.replace') && (line.includes('&') || line.includes('"') || line.includes("'"))) {
    console.log(i+1, JSON.stringify(line));
  }
});