// app.js

const express = require('express');
const http = require('http');
const https = require('https');
const socketIO = require('socket.io');
const ExcelJS = require('exceljs');
const { upload, handleFileUpload } = require('./upload');
const app = express();
const port = 3000;
const { connectconlanube, db } = require('./config/dbnube');
const rutas = require('./rutas');
const multer = require('multer');
const server = http.createServer(app);

const fs = require('fs');

const ejs = require('ejs'); // Importamos el módulo ejs
const path = require('path');
const bodyParser = require('body-parser');

// Función para eliminar carpetas si existen
const eliminarCarpetas = () => {
 // const carpetasAEliminar = ['.wwebjs_auth', '.wwebjs_cache'];

 // carpetasAEliminar.forEach(carpetas => {
  //  const rutaCarpeta = path.join(__dirname, carpetas);

    // Verificar si la carpeta existe
   // if (fs.existsSync(rutaCarpeta)) {
      // Eliminar la carpeta
   //   fs.rmdirSync(rutaCarpeta, { recursive: true });
    //  console.log(`Se eliminó la carpeta ${carpetas}`);
 //   }
 // });
};

// Llamada a la función al iniciar el servidor
eliminarCarpetas();
// Configurar Socket.io en el servidor
const io = socketIO(server);

// Verifica la conexión a la base de datos antes de permitir que las rutas manejen las solicitudes
app.use((req, res, next) => {
  if (db.readyState === 1) {
    next();
  } else {
    // Puedes personalizar la respuesta en caso de que no haya conexión a la base de datos
    res.render('errosdb');
  }
});

// Configuración de EJS como motor de plantillas
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de archivos estáticos
app.use(express.static(__dirname + '/public'));

// Configuración de multer para manejar la carga de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, __dirname + '/public/logomensaje');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const uploadImage = multer({ storage: storage }).single('imagen');

// Ruta para manejar la carga de imágenes
app.post('/subir-imagen', (req, res) => {
  uploadImage(req, res, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al subir la imagen.');
    }
    res.send('Imagen subida correctamente.');
  });
});

// Rutas principales
app.use('/', rutas(io));

// Ruta para la página de carga de archivos
app.get('/upload', (req, res) => {
  res.render('upload');
});

// Ruta para manejar la carga de archivos
app.post('/upload', upload.single('file'), handleFileUpload);



// Endpoint para guardar la plantilla en un archivo
app.post('/guardarPlantilla', (req, res) => {
  // Directorio donde se almacenarán las plantillas
  const plantillasDir = path.join(__dirname, 'public', 'plantillas');
  
  const contenido = req.body.contenido; // Obtener el contenido del cuerpo de la solicitud

  // Verificar si el directorio de plantillas existe, de lo contrario, crearlo
  if (!fs.existsSync(plantillasDir)) {
      fs.mkdirSync(plantillasDir, { recursive: true });
  }

  // Ruta del archivo de plantilla
  const rutaArchivo = path.join(plantillasDir, 'plantilla.txt');

  // Escribir el contenido en el archivo
  fs.writeFile(rutaArchivo, contenido, err => {
      if (err) {
          console.error('Error al guardar la plantilla:', err);
          res.status(500).send('Error al guardar la plantilla');
      } else {
          console.log('Plantilla guardada correctamente');
          res.status(200).send('Plantilla guardada correctamente');
      }
  });
});




app.get('/obtenerPlantilla/:nombreArchivo', (req, res) => {
  const nombreArchivo = req.params.nombreArchivo; // Obtener el nombre del archivo de la URL
  console.log(nombreArchivo);
  const rutaArchivo = `public/backplantillas/${nombreArchivo}`; // Ruta del archivo con el nombre proporcionado

  // Realizar operaciones con el archivo utilizando la ruta obtenida
  // Por ejemplo, leer el contenido del archivo y enviarlo como respuesta
  fs.readFile(rutaArchivo, 'utf8', (err, data) => {
      if (err) {
          console.error('Error al leer el archivo:', err);
          res.status(500).send('Error al leer el archivo');
      } else {
          res.send(data); // Enviar el contenido del archivo como respuesta
      }
  });
});

app.post('/guardar_valor', (req, res) => {

  const { FILA } = req.body;
  const archivo = 'numerofilatelefono';

  // Escribir el valor en el archivo
  fs.writeFile(archivo, FILA, (err) => {
      if (err) {
          console.error(err);
          res.status(500).send('Error interno del servidor');
      } else {
          res.send('Valor guardado con éxito');
      }
  });
});


app.get('/valorfila', (req, res) => {
  // Leer el valor guardado en el archivo
  fs.readFile('numerofilatelefono', 'utf8', (err, data) => {
      if (err) {
          console.error(err);
          res.render('index', { FILA: '' }); // Renderiza la página con FILA vacío
      } else {
          res.render('index', { FILA: data }); // Renderiza la página con el valor de FILA
      }
  });
});


app.post('/getFileContent', (req, res) => {
    const fileName = req.body.fileName;
    const filePath = path.join(__dirname, 'public', 'backplantillas', fileName); // Ruta del archivo seleccionado
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error al leer el archivo:', err);
            res.status(500).send('Error al leer el archivo.');
        } else {
            res.send(data);
        }
    });
});




// Endpoint para guardar la plantilla en un archivo con un nombre específico
app.post('/guardarPlantillaBtn', (req, res) => {
  // Directorio donde se almacenarán las plantillas
  const plantillasDir = path.join(__dirname, 'public', 'backplantillas');
  
  const contenido = req.body.contenido; // Obtener el contenido del cuerpo de la solicitud
  const nombreArchivo = req.body.nombreArchivo; // Obtener el nombre del archivo del cuerpo de la solicitud

  // Verificar si el directorio de plantillas existe, de lo contrario, crearlo
  if (!fs.existsSync(plantillasDir)) {
      fs.mkdirSync(plantillasDir, { recursive: true });
  }

  // Ruta del archivo de plantilla con el nombre proporcionado por el usuario
  const rutaArchivo = path.join(plantillasDir, nombreArchivo + '.txt');

  // Escribir el contenido en el archivo
  fs.writeFile(rutaArchivo, contenido, err => {
      if (err) {
          console.error('Error al guardar la plantilla:', err);
          res.status(500).send('Error al guardar la plantilla');
      } else {
          console.log('Plantilla guardada correctamente');
          res.status(200).send('Plantilla guardada correctamente');
      }
  });
});


// Endpoint para obtener los datos actualizados del directorio "public/backplantillas"
app.get('/obtenerDatosDirectorio', (req, res) => {
  const publicDir = './public/backplantillas'; // Directorio "public/backplantillas" en el servidor
  let treeData = [];

  fs.readdir(publicDir, (err, files) => {
      if (err) {
          console.error(err);
          res.status(500).send('Error al leer el directorio "public/backplantillas".');
          return;
      }

      files.forEach(file => {
          treeData.push({
              text: file,
              type: fs.statSync(path.join(publicDir, file)).isDirectory() ? 'folder' : 'file'
          });
      });

      res.json(treeData); // Enviar los datos actualizados como respuesta
  });
});



// Definir la ruta POST para eliminar un archivo
app.post('/eliminarArchivo', (req, res) => {
  const fileName = req.body.fileName; // Obtener el nombre del archivo a eliminar

  // Construir la ruta completa del archivo a eliminar
  const filePath = path.join(__dirname, 'public', 'backplantillas', fileName);

  // Verificar si el archivo existe
  if (fs.existsSync(filePath)) {
      // Eliminar el archivo
      fs.unlink(filePath, (err) => {
          if (err) {
           //   console.error('Error al eliminar el archivo:', err);
              res.status(500).send('Error al eliminar el archivo');
          } else {
//              console.log('Archivo eliminado con éxito:', fileName);
              res.status(200).send('Archivo eliminado con éxito');
          }
      });
  } else {
      res.status(404).send('El archivo no existe');
  }
});


app.get('/conver', (req, res) => {
  res.render('conver');
});
 

server.listen(port, '0.0.0.0', () => {
  console.log(`HOLA !! SOY PUSHI Y ESTOY EN LINEA EN :${port} UN MOMENTO INTENTANDO  CONECTANDO CON MONGO , ESPERA..`);
});
