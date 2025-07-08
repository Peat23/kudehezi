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


// Ruta para el formulario de registro
app.get('/panel', (req, res) => {
  res.render('panel');
});

// ruta para anadir un nuevo usuario
app.post('/anadir', async (req, res) => {
  const { nombre, email, password } = req.body;

  try {
    const result = await db.collection('usuarios').insertOne({ nombre, email, password });
    res.status(201).json({ message: 'Usuario añadido', userId: result.insertedId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al añadir usuario' });
  }
});


// ruta para actualizar
app.put('/actualizar', async (req, res) => {
  console.log('Body reçu:', req.body); // Ajoute ceci pour debug
  const { id, nombre, email, password } = req.body;

  try {
    const result = await db.collection('usuarios').updateOne(
      { _id: new mongoDb.ObjectId(id) },
      { $set: { nombre, email, password } }
    );

    if (result.modifiedCount > 0) {
      res.json({ message: 'Usuario actualizado' });
    } else {
      res.status(404).json({ message: 'Usuario no encontrado o no se realizaron cambios' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
});

// ruta para eliminar un usuario
// Asegúrate de que el ID del usuario sea un ObjectId válido
app.delete('/eliminar/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await db.collection('usuarios').deleteOne({ _id: new mongoDb.ObjectId(userId) });

    if (result.deletedCount > 0) {
      res.json({ message: 'Usuario eliminado' });
    } else {
      res.status(404).json({ message: 'Usuario no encontrado' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar usuario' });
  }
});

app.listen( PORT, () => console.log(`Servidor en http://localhost:${PORT}`));