// Ejecuta esto en Node.js para generar un nuevo hash
const bcrypt = require('bcryptjs');
const password = 'admin123';
const hash = bcrypt.hashSync(password, 12);
console.log('Nuevo hash:', hash);