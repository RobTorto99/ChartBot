import ExcelJS from 'exceljs';
import Papa from 'papaparse';
import { FileAttachment } from '../types';

export async function parseFile(file: File): Promise<FileAttachment> {
  // Verificar si el archivo está vacío
  if (file.size === 0) {
    throw new Error('El archivo seleccionado está vacío. Por favor, elige un archivo válido.');
  }

  const extension = file.name.split('.').pop()?.toLowerCase();

  if (!extension) {
    throw new Error('El archivo debe tener una extensión válida (.csv, .xlsx o .xls)');
  }

  if (extension === 'csv') {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        complete: (results) => {
          if (results.errors && results.errors.length > 0) {
            reject(new Error('Formato CSV inválido. Por favor, verifica tu archivo e inténtalo de nuevo.'));
            return;
          }
          
          const content = results.data as string[][];
          if (!content.length || (content.length === 1 && content[0].length === 1 && !content[0][0])) {
            reject(new Error('El archivo CSV está vacío o no contiene datos válidos.'));
            return;
          }

          // Validar y limpiar los datos
          const cleanContent = content.map(row => 
            row.map(cell => cell?.toString().trim() ?? '')
          );

          resolve({
            name: file.name,
            type: file.type,
            content: cleanContent,
            preview: cleanContent.slice(0, 6), // Encabezado + 5 filas
          });
        },
        error: (error) => {
          reject(new Error(`Error al parsear el CSV: ${error.message}`));
        },
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
      });
    });
  } else if (['xlsx', 'xls'].includes(extension)) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      if (workbook.worksheets.length === 0) {
        throw new Error('El archivo Excel no contiene hojas.');
      }

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error('La primera hoja del archivo Excel está vacía.');
      }

      const content: (string | Date)[][] = [];

      worksheet.eachRow({ includeEmpty: false }, (row) => {
        const rowData: (string | Date)[] = [];

        row.eachCell({ includeEmpty: false }, (cell) => {
          if (cell.value instanceof Date) {
            rowData.push(cell.value); // Mantener como Date
          } else {
            rowData.push(cell.value?.toString().trim() ?? '');
          }
        });

        content.push(rowData);
      });


      if (!content.length || (content.length === 1 && content[0].length === 0)) {
        throw new Error('El archivo Excel no contiene datos.');
      }

      // Validar y limpiar los datos
      const cleanContent = content.map(row =>
        row.map(cell => {
          if (cell instanceof Date) {
            return cell.toISOString();
          }
          return cell.toString().trim();
        })
      );      

      return {
        name: file.name,
        type: file.type,
        content: cleanContent,
        preview: cleanContent.slice(0, 6), // Encabezado + 5 filas
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al parsear el archivo Excel: ${error.message}`);
      }
      throw new Error('Error al parsear el archivo Excel: Ocurrió un error desconocido');
    }
  }

  throw new Error('Tipo de archivo no soportado. Por favor, sube un archivo CSV o Excel (.csv, .xlsx, .xls)');
}
