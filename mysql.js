const express = require('express');
const multer = require('multer');
const { parse } = require('csv-parser');
const mysql = require('mysql2/promise');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Configuración de conexión a MySQL con tus datos
const db = mysql.createPool({
    host: '157.180.40.190',                             // servidor MySQL
    user: 'root',                                       // usuario
    password: 'scORHWprCvp26Gz1zwPQgSsokHyPC2',         // contraseña
    database: 'db_andrescortes_ejercicio',              // base de datos
    waitForConnections: true,                           // si no hay conexiones, esperar
    connectionLimit: 40,                                // máximo de conexiones simultáneas
    queueLimit: 0                                       // sin límite de cola
});

// Conectar a la base de datos

async function startServer() {
    try {
        // Intentar obtener una conexión para verificar que la base de datos está disponible
        const connection = await db.getConnection();
        console.log('Conectado a MySQL');
        connection.release(); // Liberar la conexión

    } catch (error) {
        console.error('Error al conectar a MySQL:', error);
        process.exit(1); // Detener el servidor si falla la conexión
    }
}

// Llamar a la función para iniciar el servidor
startServer();



// Endpoint para subir CSV
app.post('/upload', upload.single('archivo'), async (req, res) => {
  const rows = [];
  
  fs.createReadStream(req.file.path)
    .pipe(parse({ columns: true, trim: true }))
    .on('data', row => rows.push(row))
    .on('end', async () => {
      try {
        if (rows.length > 0) {
          // Preparar los valores para inserción segura
          const values = rows.map(r => [r.nombre, r.email, r.edad]);
          
          // Insertar múltiples filas de forma segura
          await db.execute(
            'INSERT INTO usuarios (nombre, email, edad) VALUES ?',
            [values]
          );
        }
        res.json({ ok: true, total: rows.length });
      } catch (error) {
        console.error('Error al insertar datos:', error);
        res.status(500).json({ error: 'Error insertando datos' });
      } finally {
        // Eliminar archivo temporal
        fs.unlinkSync(req.file.path);
      }
    });
});

// Iniciar servidor
app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});