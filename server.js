import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import mongoDb from 'mongodb';
import session from 'express-session';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';// Importar dotenv para manejar variables de entorno

dotenv.config();

// Configuración de variables de entorno
const PORT = process.env.PORT ;
const app = express();

// Configuración de __dirname para ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SECRET, // Clave secreta para la sesión
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Configuración de EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Conexión a MongoDB
const conn_str = 'mongodb://localhost:27017';
const client = new mongoDb.MongoClient(conn_str);

let conn, db;
(async () => {
  try {
    conn = await client.connect();
    db = conn.db('kudehezi');
    console.log('Conectado a MongoDB');
  } catch (err) {
    console.error('Error MongoDB:', err);
  }
})();

// Middleware de autenticación
const requireAuth = (req, res, next) => {
  if (req.session.user) return next();
  res.redirect('/');
};

// Middleware para prevenir el cacheo de páginas protegidas
const noCache = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
};

// Rutas
app.get('/', (req, res) => {
  res.render('login');
});

// Registro de usuario
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await db.collection('users').findOne({ email });
  
  if (!user) {
    return res.render('login', { error: 'Usuario no encontrado' });
  }
  
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.render('login', { error: 'Contraseña incorrecta' });
  }

  req.session.user = user;
  res.redirect('/panel');
});

// Cerrar sesión
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Ruta protegida para el panel
app.get('/panel', requireAuth, noCache, async (req, res) => {
  try {
    const acciones = await db.collection('acciones').find().toArray();
    res.render('panel', { 
      acciones,
      user: req.session.user 
    });
  } catch (error) {
    console.error('Error panel:', error);
    res.status(500).send('Error del servidor');
  }
});

// Nueva ruta para obtener acciones filtradas
app.get('/api/acciones', requireAuth, async (req, res) => {
  try {
    const { fechaDesde, fechaHasta, nombre, tipo, ordenarPor } = req.query;
    
    // Construir el filtro de MongoDB
    let filter = {};
    
    // Filtro por fecha
    if (fechaDesde || fechaHasta) {
      filter.fechaInicio = {};
      if (fechaDesde) {
        filter.fechaInicio.$gte = new Date(fechaDesde);
      }
      if (fechaHasta) {
        filter.fechaInicio.$lte = new Date(fechaHasta);
      }
    }
    
    // Filtro por nombre
    if (nombre) {
      filter.nombre = { $regex: nombre, $options: 'i' };
    }
    
    // Filtro por tipo
    if (tipo) {
      filter.tipo = tipo;
    }
    
    // Construir el ordenamiento
    let sort = {};
    if (ordenarPor) {
      const [campo, direccion] = ordenarPor.split('-');
      sort[campo] = direccion === 'desc' ? -1 : 1;
    } else {
      sort.fechaInicio = -1; // Por defecto, ordenar por fecha de inicio descendente
    }
    
    const acciones = await db.collection('acciones').find(filter).sort(sort).toArray();
    res.json(acciones);
  } catch (error) {
    console.error('Error al obtener acciones filtradas:', error);
    res.status(500).json({ error: 'Error al obtener acciones' });
  }
});

// CRUD para Acciones
// Crear, Leer, Actualizar y Eliminar acciones
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

// Obtener una acción por ID (para editar)
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

// Ruta para cambiar contraseña
app.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Verificar que las contraseñas coincidan
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Las contraseñas nuevas no coinciden' });
    }
    
    // Verificar que la nueva contraseña tenga al menos 6 caracteres
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }
    
    // Obtener el usuario actual
    const user = await db.collection('users').findOne({ _id: new mongoDb.ObjectId(req.session.user._id) });
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Verificar la contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'La contraseña actual es incorrecta' });
    }
    
    // Encriptar la nueva contraseña
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    // Actualizar la contraseña en la base de datosostrando 1 - 10 de 
    const result = await db.collection('users').updateOne(
      { _id: new mongoDb.ObjectId(req.session.user._id) },
      { $set: { password: hashedNewPassword } }
    );
    
    if (result.modifiedCount > 0) {
      res.json({ success: true, message: 'Contraseña actualizada correctamente' });
    } else {
      res.status(500).json({ error: 'Error al actualizar la contraseña' });
    }
    
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.listen( PORT, () => console.log(`Servidor en http://localhost:${PORT}`));