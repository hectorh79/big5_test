/**
 * CÓDIGO PARA GOOGLE APPS SCRIPT
 * -------------------------------------------------------------
 * Permite recibir las respuestas del test Big 5 automáticamente
 * y guardarlas en una hoja de cálculo de Google Sheets.
 *
 * INSTRUCCIONES DE INSTALACIÓN (Toma menos de 2 minutos):
 * 1. Entra a Google Drive y crea una nueva "Hoja de cálculo de Google" (Google Sheet).
 * 2. En el menú superior de la hoja, haz clic en: Extensiones > Apps Script.
 * 3. Borra todo el código que aparezca y pega este archivo completo.
 * 4. Haz clic en "Implementar" (botón azul arriba a la derecha) > "Nueva implementación".
 * 5. En el icono de engranaje (⚙️ Seleccionar tipo), elige: "Aplicación web".
 * 6. Configura lo siguiente:
 *    - Descripción: "Webhook Big 5"
 *    - Ejecutar como: "Yo" (tu cuenta de correo)
 *    - Quién tiene acceso: "Cualquier persona" (¡IMPORTANTE para que la página web pueda enviar los datos!)
 * 7. Haz clic en "Implementar". Concede los permisos que Google te pida.
 * 8. Copia la "URL de la aplicación web" (termina en /exec) y pégala en la configuración de la página web (o en app.js).
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Si la hoja está vacía, crear los encabezados automáticamente
    if (sheet.getLastRow() === 0) {
      var headers = [
        "Fecha / Hora",
        "Nombre Completo",
        "Correo Electrónico",
        "Apertura (O)",
        "Responsabilidad (C)",
        "Extraversión (E)",
        "Amabilidad (A)",
        "Neuroticismo (N)"
      ];
      
      // Agregar encabezados de las 44 preguntas individuales
      for (var i = 1; i <= 44; i++) {
        headers.push("P" + i);
      }
      
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#EEF2FF");
      sheet.setFrozenRows(1);
    }
    
    // Preparar fila con datos del usuario y puntajes calculados
    var row = [
      data.timestamp || new Date().toLocaleString(),
      data.fullName || "Anónimo",
      data.email || "No especificado",
      data.scores.O ? data.scores.O.toFixed(2) : "",
      data.scores.C ? data.scores.C.toFixed(2) : "",
      data.scores.E ? data.scores.E.toFixed(2) : "",
      data.scores.A ? data.scores.A.toFixed(2) : "",
      data.scores.N ? data.scores.N.toFixed(2) : ""
    ];
    
    // Agregar las respuestas 1 a 44
    for (var q = 1; q <= 44; q++) {
      row.push(data.answers && data.answers[q] !== undefined ? data.answers[q] : "");
    }
    
    sheet.appendRow(row);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Datos guardados correctamente" }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("El webhook del Test Big 5 está activo y listo para recibir datos.")
    .setMimeType(ContentService.MimeType.TEXT);
}
