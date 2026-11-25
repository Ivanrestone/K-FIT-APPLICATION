const fs = require('fs');
const sql = fs.readFileSync(process.argv[2], 'utf8');
fs.writeFileSync('payload.json', JSON.stringify({ query: sql }));
console.log('payload.json written, sql length:', sql.length);
