// rutas.js

const express = require('express');
const router = express.Router();
const qrcode = require('qrcode');
const {  MessageMedia, Client, LocalAuth } = require('whatsapp-web.js');
const ExcelJS = require('exceljs');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const gracefulFs = require('graceful-fs');
const config = require('./config/config');
const  ao = require('./config/ao');
const dayjs = require('dayjs');
  const moment = require('moment-timezone');
const axios = require('axios');


// Obtener el número de la URL remota
async function obtenerNumero(url) {
    try {
        const response = await axios.get(url);
        return response.data; // No necesitas llamar a trim() aquí
    } catch (error) {
        console.error("Error al obtener el número:", error);
        return null;
    }
}





module.exports = function (io) {
    let qrCodeURL;
    const client = new Client({
     //   authStrategy: new LocalAuth({
   //         clientId: "bot-server"
    //    }),
   //    webVersion: "2.2409.2",
    //    webVersionCache: {
       //     type: "remote",
        //    remotePath:
        //    'http://localhost:3000/wat/2.2409.2.html',
          //  "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2409.2.html",
        //  https://raw.githubusercontent.com/arielobolo/pushi/main/index.js
     //   }
    });

    let estado = 0;

    io.on('connect', (socket) => {
        // Emitir el evento 'requestStatus' al cliente
        io.emit('authenticated', estado);
        io.emit('statusResponse', estado);
    });

   io.on('requestStatus', () => {
        // Emite el estado actual al cliente en respuesta a la solicitud
     
      
    });

    client.on('authenticated', async (session) => {
        try {
            console.log('ENTRAMOS A WHATSAPP CON EXITO !!');
            // Tu lógica de inicialización aquí
             estado = 1;
            io.emit('authenticated', estado);
        } catch (error) {
            console.error('Error durante la autenticación:', error);
        }
    });

 

client.initialize();

   // client.initialize();

    client.on("qr", async (qr) => {
        try {
            qrCodeURL = await generateQRCodeDataURL(qr);
            console.log('PAGINA WEB CON CODIGO QR ESPERANDO !!');
            io.emit('authenticated', 0);
            io.emit('qrCodeUpdated', qrCodeURL);
        } catch (error) {
            console.error('Error durante la generación del código QR:', error);
        }
    });

    async function generateQRCodeDataURL(qr) {
        try {
            const qrCodeDataURL = await qrcode.toDataURL(qr);
            return qrCodeDataURL;
        } catch (error) {
            console.error("Error al generar el código QR:", error);
            return null;
        }
    }
     //"5493516635793",
      //  "5493512278788"
        //"5493512815567"


    const send_message = [
        config.send_message
    ];


    let checkconection = 0;
    const imageUrl = '/imagen/ONPUSHISAP.gif';
    client.on("ready", async () => {
        try {
            console.log("AHORA TE ENVIARE UN MENSAJE AL TELEFONO PARA FINALIZAR AGUARDA...CUANDO RECIBAS EL MENSAJE ESTAREMOS LISTOS!! GO!");
            
            send_message.map(async value => {
                const chatId = value + "@c.us";
                
                // Crea un objeto MessageMedia desde la URL de la imagen
                const media = await MessageMedia.fromUrl(imageUrl);
                
                try {
                    // Enviar un mensaje al número que envió el mensaje
                    await client.sendMessage(chatId, "MENSAJE TEST VINCULADO OK!!", {
                        media: media
                    });
                    console.log(`ENVIANDOTE MENSAJE DE PRUEBA A ${chatId}`);
                } catch (error) {
                    console.error(`ERROR AL ENVIARTE MENSAJE DE PRUEBA ${chatId}: ${error.message}`);
                }
            });
        } catch (error) {
            console.error('Error durante el evento "ready":', error);
        }
    });


/////////////////////////////////////////////////////////////////////////////////////////////


// Objeto para almacenar las imágenes asociadas a cada estado del turno
const imagenes = {
    'Confirmado': 'imagen/confirmado.jpg',
    'Cancelado': 'imagen/cancelado.jpg',
    'Reprogramado': 'imagen/reprogramado.jpg',
    'semana': 'imagen/semana.jpg',
    'default': 'imagen/menuturno.jpg',
    'notFound': 'imagen/404turno.jpg'
};

client.on('message', async message => {
    try {
        if (message.fromMe) return; // Ignorar mensajes propios

        const fullPhoneNumber = message.from; // Obtener el número de teléfono completo del remitente
        const adjustedPhoneNumber = fullPhoneNumber.replace('549351', '').replace('@c.us', ''); // Ajustar el número de teléfono

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile('xlsx/listado.xlsx');

        const worksheet = workbook.getWorksheet('Todo'); // Asumiendo que la hoja se llama 'Todo'

        let phoneNumberFound = false;
        let rowData = {}; // Objeto para almacenar los datos de las celdas de la fila X

        worksheet.getColumn('L').eachCell({ includeEmpty: true }, function(cell, rowNumber) {
            if (rowNumber > 1 && cell.value && cell.value.toString() === adjustedPhoneNumber) {
                phoneNumberFound = true;

                // Guardar los datos de las celdas de la fila X en rowData
                worksheet.getRow(rowNumber).eachCell({ includeEmpty: true }, function(cell, colNumber) {
                    rowData[String.fromCharCode(64 + colNumber)] = cell.value;
                });

                const turnoStatus = rowData['Q'] ? rowData['Q'].toString() : '';

                // Verificar el estado del turno antes de procesar la solicitud del usuario
                let imagen = imagenes[turnoStatus] || imagenes['default'];
                switch (turnoStatus) {
                    case 'Confirmado':
                        break;
                    case 'Cancelado':
                        break;
                    case 'Reprogramado':
                        break;
                    case 'semana':
                            break;
                    default:
                        // Procesar la solicitud del usuario
                        const name = rowData['I'] ? rowData['I'].toString() : '';
                    //    const horas = rowData['C'] ? rowData['C'].toString() : '';
                        switch (message.body) {
                            case '1':
                                worksheet.getCell(`Q${rowNumber}`).value = 'Confirmado';
                                imagen = imagenes['Confirmado'] || imagenes['default'];
                                break;
                            case '2':
                                worksheet.getCell(`Q${rowNumber}`).value = 'Cancelado';
                                imagen = imagenes['Cancelado'] || imagenes['default'];
                                break;
                            case '3':
                                worksheet.getCell(`Q${rowNumber}`).value = 'Reprogramado';
                                imagen = imagenes['Reprogramado'] || imagenes['default'];
                                break;
                                case '4':
                                    worksheet.getCell(`Q${rowNumber}`).value = 'semana';
                                    imagen = imagenes['semana'] || imagenes['default'];
                                    break;
                        }
                }

                // Guardar los cambios en el archivo de Excel
                workbook.xlsx.writeFile('xlsx/listado.xlsx').catch(error => {
                    console.error('Error al guardar el archivo de Excel:', error);
                });

                // Enviar la respuesta al usuario
                if (imagen) {
                    // Cargar la imagen directamente desde el sistema de archivos
                    const imagePath = path.join(__dirname, 'public',imagen);
                    const media = MessageMedia.fromFilePath(imagePath);
                    client.sendMessage(message.from, media).catch(error => {
                        console.error('Error al enviar el mensaje con imagen al usuario:', error);
                    });
                }
            }
        });

        if (!phoneNumberFound) {
            const notFoundImage = imagenes['notFound'] || imagenes['default'];
            const imagePath = path.join(__dirname, 'public', notFoundImage);
            const media = MessageMedia.fromFilePath(imagePath);
            client.sendMessage(message.from, media).catch(error => {
                console.error('Error al enviar el mensaje al usuario:', error);
            });
        }

    } catch (error) {
        console.error('Error al procesar el mensaje:', error);
    }
});
/////////////////////////////////////////////////////////////////////////////////////////////



    // Modifica la ruta para que devuelva una respuesta JSON
// Ruta para enviar un mensaje
router.post('/enviar-mensaje', async (req, res) => {
    try {
        console.log("Datos recibidos del formulario:", req.body);

        const { imagena , pais, cod, numero, mensaje } = req.body;

        // Validar si se proporciona un número y un mensaje
        if (!numero || !mensaje) {
            return res.status(400).json({ error: 'Número y mensaje son campos obligatorios.' });
        }

        // Combinar el código y el número
        const numeroCompleto = `${pais}${cod}${numero}`;

        // Formatear el número para incluir la cadena "@c.us"
        const chatId = `${numeroCompleto}@c.us`;

        // Obtener la URL de la imagen
       // const imageUrl = 'http://localhost:3000/imagen/1.gif';
const baseUrl = 'http://localhost:3000/';
      const imageUrl = baseUrl + imagena;
        // Crear un objeto MessageMedia desde la URL de la imagen
        const media = await MessageMedia.fromUrl( imageUrl);

        // Enviar el mensaje con la imagen
        await client.sendMessage(chatId, mensaje, { media: media });

        console.log(`Mensaje enviado a ${chatId}: ${mensaje}`);
        res.status(200).json({ success: 'Mensaje enviado exitosamente.' });
    } catch (error) {
        console.error('Error en la ruta /enviar-mensaje:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

    client.on('disconnected', (reason) => {
        console.log('Desconectado:', reason);

        // Puedes agregar aquí lógica adicional si es necesario antes de la reinicialización
        io.emit('authenticated', 0);
        // Volver a inicializar el cliente después de una desconexión
        retryInitialize();
    });

    async function retryInitialize() {
        try {
            console.log('Intentando reinicialización...');
            await client.initialize();
            console.log('Reinicialización exitosa.');

            // Emitir un mensaje a través de Socket.io para indicar que la página está esperando un nuevo código QR
            io.emit('waitingForQR', true);
        } catch (error) {
            console.error('Error durante la reinicialización:', error);

            // Puedes agregar aquí la lógica que consideres apropiada para manejar este error específico
            // Por ejemplo, puedes intentar la reinicialización nuevamente después de un breve período de tiempo
        }
    }

    router.get('/qr', (req, res) => {
        try {
            // Asegúrate de que qrCodeURL sea una cadena antes de pasarlo a la vista
            const qrCode = qrCodeURL ? qrCodeURL.toString() : '';
            res.render('qr', { qrCode });
        } catch (error) {
            console.error('Error al renderizar la vista QR:', error);
            res.status(500).send('Error interno del servidor');
        }
    });

 
// Ruta al directorio 'xlsx'
const xlsxDirectory = path.join(__dirname, 'xlsx');

router.get('/push', async (req, res) => {
  
        res.render('push',);

});

const plantillasDirectory = path.join(__dirname, 'public', 'backplantillas');


router.get('/push', async (req, res) => {
    res.render('push');
});

function obtenerHoraActual() {
    return dayjs().format(); // Formato predeterminado: 'YYYY-MM-DDTHH:mm:ssZ'
}


router.get('/', async (req, res) => {
    const workbook = new ExcelJS.Workbook();
    const filePath = 'xlsx/listado.xlsx';
    const qrCodeURL = ''; // Definir la URL del código QR si es necesario
    const qrCode = qrCodeURL ? qr.imageSync(qrCodeURL, { type: 'png' }) : '';
  
    workbook.xlsx.readFile(filePath)
    .then(() => {
        const worksheet = workbook.getWorksheet('Todo');
        const data = [];
    
        worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
            const rowData = [];
    
            // Recorrer cada celda de la fila y agregar su valor a rowData
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                let cellValue = cell.text; // Obtener el valor de la celda como texto
             
                rowData.push(cellValue); // Agregar el valor de la celda a rowData
            });




            data.push(rowData); // Agregar la fila a los datos
        });



        const publicDir = './public/backplantillas'; // Directorio "public" en el servidor
        let treeData = [];
    
        fs.readdir(publicDir, (err, files) => {
            if (err) {
                console.error(err);
                res.status(500).send('Error al leer el directorio "public".');
                return;
            }
    
            files.forEach(file => {
                treeData.push({
                    text: file,
                    type: fs.statSync(path.join(publicDir, file)).isDirectory() ? 'folder' : 'file'
                });
            });
        


            function formatCellValue(cell) {
                return cell.text;
            }

            function convertirNumeroALetras(numero) {
                // Convertir el número a letras correspondientes a su valor
                var letras = '';
                while (numero > 0) {
                    // Calcular el código ASCII de la letra correspondiente al residuo del número dividido entre 26
                    var codigoAscii = (numero - 1) % 26 + 65;
                    // Convertir el código ASCII a letra y concatenarla al principio de la cadena 'letras'
                    letras = String.fromCharCode(codigoAscii) + letras;
                    // Restar 1 al número dividido entre 26
                    numero = Math.floor((numero - 1) / 26);
                }
                return letras;
            }

            // Leer el valor guardado anteriormente en el archivo numerofilatelefono
            fs.readFile('numerofilatelefono', 'utf8',async (err, filaGuardada) => {
                if (err) {
                    console.error('Error al leer el archivo numerofilatelefono:', err);
                    res.status(500).send('Error al leer el archivo numerofilatelefono.');
                } else {
                    // Convertir el valor leído en el archivo a letras
                    var letras = convertirNumeroALetras(parseInt(filaGuardada));
 // Renderizar la vista 'push' y pasar los datos
               
               
               
                    const url = 'https://raw.githubusercontent.com/arielobolo/pushi/main/index.js';
    
                    // Obtener el número
                    const numero = await obtenerNumero(url);
                  //  console.log(numero);
                    const numeroStr = String(numero);
               
                    const { NUMERO_SECRETO } = ao;

               

                    if (numeroStr === NUMERO_SECRETO) {
                        res.render('push', { rowData: data, qrCode, FILA: letras, FILAN: filaGuardada ,treeData });
                    } else { 
                        res.render('puff', { rowData: data, qrCode, FILA: letras, FILAN: filaGuardada ,treeData }); // Renderizar la ruta 'puff'
                    }               
               
                }
            });
        //    console.log(treeData); // Mover el console.log dentro de la función de readdir
        });
        })
        .catch(error => {
            console.error('Error al leer el archivo Excel se requiere de un archivo .xlsx en la carpeta xlsx');
            res.render('subirarchivo');
        });
});



    router.get('/actualizarTabla', async (req, res) => {
        const workbook = new ExcelJS.Workbook();
        const filePath = 'xlsx/listado.xlsx';
    
        workbook.xlsx.readFile(filePath)
            .then(() => {
                const worksheet = workbook.getWorksheet('Todo');
                const data = [];
    
                worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
                    const rowData = [
                        row.getCell('A').text,
                        row.getCell('C').text,
                        row.getCell('D').text,
                        row.getCell('F').text,
                        row.getCell('I').value,
                        row.getCell('L').value
                    ];
                    data.push(rowData);
                });
    
                res.json({ rowData: data }); // Devolver los nuevos datos en formato JSON
            })
            .catch(error => {
                console.error('Error al leer el archivo Excel:', error);
                res.status(500).send('Error al leer el archivo Excel.');
            });
    });
    

// Configuración de Multer para guardar archivos en la carpeta 'xlsx' con el nombre 'listado.xlsx'
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'xlsx'); // Carpeta donde se guardarán los archivos
    },
    filename: function (req, file, cb) {
        cb(null, 'listado.xlsx'); // Siempre guardar como 'listado.xlsx'
    }
});

const upload = multer({ storage: storage });

// Ruta para guardar el archivo
router.post('/guardar-archivo', upload.single('file'), (req, res) => {
    res.send('Archivo guardado correctamente.');
});




// Configuración de Multer para guardar archivos GIF en la carpeta 'public/imagen' con el nombre '1.gif'
const storageGIF = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/imagen'); // Carpeta donde se guardarán los archivos GIF
    },
    filename: function (req, file, cb) {
        cb(null, '1.gif'); // Siempre guardar como '1.gif'
    }
});

const uploadGIF = multer({ 
    storage: storageGIF,
    fileFilter: function (req, file, cb) { // Filtrar solo archivos GIF
        if (!file.originalname.match(/\.(gif)$/)) {
            return cb(new Error('Solo se permiten archivos GIF.'));
        }
        cb(null, true);
    }
});

// Ruta para manejar el archivo 2 (imagen1)
router.post('/imagen1', uploadGIF.single('file'), (req, res) => {
    res.send('Archivo 2 (GIF) guardado correctamente.');
});



// Configuración de Multer para guardar archivos GIF en la carpeta 'public/imagen' con el nombre '2.gif'
const storageGIF2 = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/imagen'); // Carpeta donde se guardarán los archivos GIF
    },
    filename: function (req, file, cb) {
        cb(null, '2.gif'); // Siempre guardar como '2.gif'
    }
});

const uploadGIF2 = multer({ 
    storage: storageGIF2,
    fileFilter: function (req, file, cb) { // Filtrar solo archivos GIF
        if (!file.originalname.match(/\.(gif)$/)) {
            return cb(new Error('Solo se permiten archivos GIF.'));
        }
        cb(null, true);
    }
});

// Ruta para manejar el archivo 3 (imagen3)
router.post('/imagen3', uploadGIF2.single('file'), (req, res) => {
    res.send('Archivo 3 (GIF) guardado correctamente.');
});




// Configuración de Multer para guardar archivos GIF en la carpeta 'public/imagen' con el nombre '3.gif'
const storageGIF3 = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/imagen'); // Carpeta donde se guardarán los archivos GIF
    },
    filename: function (req, file, cb) {
        cb(null, '3.gif'); // Siempre guardar como '3.gif'
    }
});

const uploadGIF3 = multer({ 
    storage: storageGIF3,
    fileFilter: function (req, file, cb) { // Filtrar solo archivos GIF
        if (!file.originalname.match(/\.(gif)$/)) {
            return cb(new Error('Solo se permiten archivos GIF.'));
        }
        cb(null, true);
    }
});

// Ruta para manejar el archivo 4 (imagen4)
router.post('/imagen4', uploadGIF3.single('file'), (req, res) => {
    res.send('Archivo 4 (GIF) guardado correctamente.');
});


// Ruta para reiniciar el servidor
router.get('/restart-server', (req, res) => {
    gracefulFs.writeFileSync('nodemon-restart.js', ''); // Crea un archivo vacío que hace que nodemon reinicie el servidor
    res.send('Reiniciando servidor...');
    setTimeout(() => {
        process.exit(0); // Reinicia el servidor después de un breve retraso
    }, 1000); // Espera 1 segundo antes de reiniciar el servidor
});




// Ruta para manejar la actualización del número
router.post('/update-number', (req, res) => {
    const newNumber = req.body.newNumber;
    if (newNumber) {
        // Actualizar el número en la configuración
        config.send_message = [newNumber];
        // Escribir el nuevo número en el archivo config.js
        const newConfigContent = `const config = {
    send_message: [
      "${newNumber}"
    ]
  };
  
  module.exports = config;`;
        fs.writeFileSync('config/config.js', newConfigContent);
        // Envía una respuesta al cliente indicando que el número se ha actualizado correctamente
      
    } else {
        // Si no se proporciona un nuevo número, envía un error al cliente
        res.status(400).send('Se requiere un nuevo número.');
    }
});




////////////////////////////////////////////////////////////////////////////////


const puppeteer = require('puppeteer');




router.post('/generarimagen', async (req, res) => {
    // Obtiene el contenido HTML enviado desde el cliente
    const contenido = req.body.contenido;
    console.log('Contenido HTML recibido:', contenido);

    try {
        // Iniciar el navegador Puppeteer
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

           // Establecer el tamaño de la página
           await page.setViewport({
            width: 400,
            height: 400
        });

        // Establecer el contenido HTML en la página
        await page.setContent(contenido);

        // Capturar una imagen de la página
        const screenshot = await page.screenshot({ fullPage: true });

        // Guardar la imagen en la raíz del servidor
        fs.writeFileSync('screenshot.png', screenshot);

        // Cerrar el navegador Puppeteer
        await browser.close();

        // Enviar una respuesta al cliente
        res.send('Imagen generada y guardada en el servidor');
    } catch (error) {
        console.error('Error al generar la imagen:', error);
        res.status(500).send('Error al generar la imagen');
    }
});

//////////////////////////////////////////////////////////////////////////////


// Ruta para obtener el número de teléfono
router.get('/obtenerNumeroTelefono', (req, res) => {
    // Aquí deberías obtener el número de teléfono de tu configuración
    const numeroTelefono = config.send_message[0]; // Suponiendo que solo hay un número en la configuración

    // Devolver el número de teléfono como respuesta
    res.json({ phoneNumber: numeroTelefono });
});



// Ruta para obtener el número de teléfono
router.get('/arbol', (req, res) => {
    const ahora = dayjs();
    const hora = ahora.format(); // Formato predeterminado: 'YYYY-MM-DDTHH:mm:ssZ'

    console.log(hora); // Verifica que la hora se esté imprimiendo correctamente en la consola

    res.render('arbol', { hora: hora }); // Pasar la hora correctamente al renderizar la vista
});


    return router;
};
