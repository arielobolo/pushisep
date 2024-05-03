// upload.js

const multer = require('multer');
const path = require('path');
const ExcelJS = require('exceljs');

// Configuración de Multer para la carga de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'xlsx/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Función para extraer el valor de la celda (manejo de richText)
function extractCellValue(cell) {
    if (cell.value && typeof cell.value === 'object' && cell.value.richText) {
        // Extrae el texto de la primera parte del richText
        return cell.value.richText[0].text;
    } else {
        return cell.value;
    }
}



const handleFileUpload = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No se ha proporcionado ningún archivo');
        }

        const filePath = req.file.path;

        const workbook = new ExcelJS.Workbook();
     
        // Intenta leer el archivo Excel
        try {
            await workbook.xlsx.readFile(filePath);
        } catch (readError) {
            console.error(readError);
            return res.status(500).send('Error al leer el archivo Excel');
        }

        // Busca la hoja con el nombre "todo"
        const selectedSheet = workbook.getWorksheet('todo');

        if (!selectedSheet) {
            return res.status(400).send('No se encontró la hoja "todo" en el archivo Excel');
        }

        const rowDataArray = [];

        // Itera sobre las filas y columnas para procesar los datos
        selectedSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            const fechaHora = extractCellValue(row.getCell('A'));
            
            // Divide la cadena en fecha y hora
            const [fecha, hora] = fechaHora.split(' ');

            // Construye un objeto con los datos de la fila
            const rowData = {
                Fecha: fecha,  // Cambiado a mostrar la fecha directamente
                Hora: hora,
                NumeroDeFila: rowNumber,  // Agregado el número de fila
                Pos: row.getCell('B').value,
                Profesional: row.getCell('C').text,
                Especialidad: row.getCell('D').text,
                Cons: row.getCell('E').value,
                Afiliado: row.getCell('F').text,
                Dni: row.getCell('G').text,
                Celular: row.getCell('H').text,
                Fijo: row.getCell('M').text ,
                Estado: row.getCell('I').text,
                Tipo: row.getCell('J').text,
                Con: row.getCell('K').text,
                Pr: row.getCell('L').text
            };

            // Aquí puedes hacer algo con el objeto rowData
            console.log('Datos de la fila:', rowData);

            // Agrega el objeto rowData al array
            rowDataArray.push(rowData);
        });

        res.status(200).json({ message: 'Datos procesados', rowDataArray });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};



module.exports = { upload, handleFileUpload };
