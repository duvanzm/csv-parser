// importaciones
const express = require('express');
const multer = require('multer');
const { parse } = require('csv-parse');
const { Pool } = require('pg');
const fs = require('fs');

// configuraciones
const app = express();
const upload = multer({ dest: 'uploads/' });

// conexiÃ³n pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'password',
  port: 5434,
});

// Crear tabla si no existe
pool.query(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100),
    email VARCHAR(100),
    edad INTEGER
  )
`);

// endpoint
app.post('/upload', upload.single('archivo'), (req, res) => {
  const rows = [];
  fs.createReadStream(req.file.path)
    .pipe(parse({ columns: true, trim: true }))
    .on('data', row => rows.push(row))
    .on('end', async () => {
      try {
        if (rows.length) {
          const values = rows.map(r => `('${r.nombre}','${r.email}',${r.edad})`).join(',');
          await pool.query(`INSERT INTO usuarios (nombre,email,edad) VALUES ${values}`);
        }
        res.json({ ok: true, total: rows.length });
      } catch {
        res.status(500).json({ error: 'Error insertando datos' });
      }
    });
});

// listen
app.listen(3000, ()=>{
  console.log('http://localhost:3000');
});