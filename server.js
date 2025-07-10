import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import mongoDb from 'mongodb';



const PORT=3000;
const app= express();

// Estas líneas son necesarias para obtener __dirname en módulos ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración de la carpeta estática para servir archivos estáticos como si estuvieran en la raíz del servidor
app.use(express.static(path.join(__dirname, 'public')))


// Middleware para procesar datos del formulario
// y JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuración de EJS como motor de plantillasapp.set('view engine', 'ejs');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configuración de la conexión a MongoDB
// Asegúrate de tener MongoDB corriendo en tu máquina
const conn_str = 'mongodb://localhost:27017';
const client = new mongoDb.MongoClient(conn_str);


//connectar a la base de datos
// y manejar errores de conexión

let conn;

try {
  conn = await client.connect();
  console.log('Conectado a MongoDB');
} catch (err) {
  console.log(err);
  console.log('No se pudo conectar a MongoDB');
}

let db = conn.db('kudehezi'); // Cambia 'mi-base-de-datos' por el nombre de tu base de datos


// Rutas
app.get('/', (req, res) => {
  res.render('login');
});

app.get('/panel', async (req, res) => {
  try {
    const acciones = await db.collection('acciones').find().toArray();
    res.render('panel', { acciones });
  } catch (error) {
    console.error('Error al obtener acciones:', error);
    res.status(500).send('Error del servidor');
  }
});

// CRUD para Acciones
app.post('/acciones', async (req, res) => {
  try {
    const result = await db.collection('acciones').insertOne(req.body);
    res.status(201).json({ id: result.insertedId });
  } catch (error) {
    console.error('Error al crear acción:', error);
    res.status(500).json({ error: 'Error al crear acción' });
  }
});

app.put('/acciones/:id', async (req, res) => {
  try {
    const result = await db.collection('acciones').updateOne(
      { _id: new mongoDb.ObjectId(req.params.id) },
      { $set: req.body }
    );
    res.json({ success: result.modifiedCount > 0 });
  } catch (error) {
    console.error('Error al actualizar acción:', error);
    res.status(500).json({ error: 'Error al actualizar acción' });
  }
});

app.delete('/acciones/:id', async (req, res) => {
  try {
    const result = await db.collection('acciones').deleteOne(
      { _id: new mongoDb.ObjectId(req.params.id) }
    );
    res.json({ success: result.deletedCount > 0 });
  } catch (error) {
    console.error('Error al eliminar acción:', error);
    res.status(500).json({ error: 'Error al eliminar acción' });
  }
});

// Obtener una acción por ID (pour l’édition)
app.get('/acciones/:id', async (req, res) => {
  try {
    const accion = await db.collection('acciones').findOne({ _id: new mongoDb.ObjectId(req.params.id) });
    if (!accion) return res.status(404).json({ error: 'Acción no encontrada' });
    res.json(accion);
  } catch (error) {
    console.error('Error al obtener acción:', error);
    res.status(500).json({ error: 'Error al obtener acción' });
  }
});


app.listen( PORT, () => console.log(`Servidor en http://localhost:${PORT}`));