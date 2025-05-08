Desarrolla una aplicación web en español llamada Factumattic que funcionará como dashboard para visualizar facturas, siguiendo estas especificaciones:

1. Configuración y Autenticación:
- Implementa Firebase utilizando las credenciales proporcionadas
- Mantén las reglas de seguridad existentes
- Desarrolla un sistema de login seguro

2. Pantalla Principal (Listado de Facturas):
- Muestra una tabla con las facturas del usuario autenticado
- Columnas obligatorias:
  * Fecha
  * Nombre Empresa Emisora
  * Total a Pagar
- Funcionalidades de ordenación:
  * Por fecha (descendente por defecto)
  * Por nombre de empresa (alfabético)
- Barra de búsqueda para filtrar por Nombre Empresa Emisora
- Implementa paginación para mejor rendimiento

3. Vista Detallada de Factura:
- Al hacer clic en una factura, mostrar todos los campos del modelo excepto file_id
- Incluir botón "Ver documento" que abra en ventana emergente dando la opción de descargar
  https://factumattic.s3.eu-north-1.amazonaws.com/<file_id>
- Organizar la información en secciones lógicas:
  * Información general
  * Datos de emisor y receptor
  * Lista de items
  * Información de IVA
  * Datos de pago

4. Exportación a CSV:
- Implementar filtros:
  * Selector de fecha inicio
  * Selector de fecha fin
- Selector múltiple de campos a exportar
- Almacenar preferencias de campos seleccionados en localStorage
- Botón de descarga que genere el CSV con los filtros aplicados

5. Requisitos Técnicos:
- Asegurar que todas las consultas a Firestore respeten las reglas existentes
- Implementar manejo de errores y estados de carga
- Diseño responsive

Estos son los datos de Firebase: 
  apiKey: "AIzaSyCM6aGLxdUxtgN5NUmo5IKOUhIlqnQKz2Q",
  authDomain: "factumatic-551ff.firebaseapp.com",
  projectId: "factumatic-551ff",
  storageBucket: "factumatic-551ff.firebasestorage.app",
  messagingSenderId: "1094149228806",
  appId: "1:1094149228806:web:ac36eb46e3e9753395f687"

Las reglas son las siguientes y no se deberían modificar a no ser que fuera necesario porque se utilizan en otras apps, como la app móvil u otra app de escritorio y hay que tener cuidado con lo que se cambia:  rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Función auxiliar para verificar si el usuario está autenticado
    function isAuthenticated() {
      return request.auth != null;
    }

    // Función auxiliar para verificar si el documento pertenece al usuario actual
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Función auxiliar para verificar si el usuario es admin
    function isAdmin() {
      return isAuthenticated() && 
        request.auth.token.email == 'info@virtualpoint.es';
    }

    // Reglas para la colección de usuarios
    match /users/{document} {
      // Allow any authenticated user to read their own document
      allow get: if isAuthenticated();
      
      // Permitir lectura si:
      // 1. El usuario está autenticado y es el propietario del documento (para la app móvil)
      // 2. O si el usuario es admin (para el panel de administración)
      allow list: if isAuthenticated() && (
        resource.data.email == request.auth.token.email ||
        isAdmin()
      );

      // Mantener las reglas existentes para create/update y añadir permisos de admin
      allow create: if isAuthenticated() && (
        request.resource.data.email == request.auth.token.email ||
        isAdmin()
      );
      
      allow update: if isAuthenticated() && (
        resource.data.email == request.auth.token.email ||
        isAdmin()
      );

      // Allow admin users to delete users
      allow delete: if isAdmin();
    }

    // Reglas para la colección de facturas
    match /invoices/{invoiceId} {
      allow read: if isAuthenticated() && 
        resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && 
        request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() && 
        resource.data.userId == request.auth.uid;
      allow delete: if false; // No permitimos eliminar facturas
    }
  }
}


Las facturas creadas por los usuarios se pueden ver en la colección invoices, que se crea a partir de estos datos, que tienen un ejemplo


{
      "Fecha": "23.12.2021",
      "Número de Factura": "aI02N211200023407",
      "Nombre Empresa Emisora": "NED SUMINISTRO GLP, S.A.U.",
      "NIF Empresa Emisora": "A95864492",
      "Dirección Empresa Emisora": "Plaza Euskadi nº. 5 Planta 23. 48009 Bilbao, Bizkaia",
      "Nombre Empresa Receptora": "LUIS MANUEL SAMPEDRO MARQUEZ",
      "NIF Empresa Receptora": "27315031R",
      "Dirección Empresa Receptora": "BO NOCINA 12, 5-D, NOCINA - GURIEZO - CANTABRIA",
      "Items": [
        {
          "Producto": "Gas propano canalizado",
          "Cantidad": "44,02",
          "Precio Unitario": "1,056726",
          "Impuesto Aplicado": "21",
          "Subtotal": "179,35",
          "Precio Total": "46,56"
        },
        {
          "Producto": "Gas propano canalizado",
          "Cantidad": "118,50",
          "Precio Unitario": "1,091637",
          "Impuesto Aplicado": "21",
          "Subtotal": "129,00",
          "Precio Total": "34,29"
        },
        {
          "Producto": "Gas propano canalizado",
          "Cantidad": "3,39",
          "Precio Unitario": "1,024809",
          "Impuesto Aplicado": "21",
          "Subtotal": "3,47",
          "Precio Total": "0,73"
        },
        {
          "Producto": "Término fijo",
          "Cantidad": "1",
          "Precio Unitario": "2,53",
          "Impuesto Aplicado": "",
          "Subtotal": "2,53",
          "Precio Total": "2,53"
        },
        {
          "Producto": "Alquiler de equipos",
          "Cantidad": "1",
          "Precio Unitario": "2,01",
          "Impuesto Aplicado": "",
          "Subtotal": "2,01",
          "Precio Total": "2,01"
        },
        {
          "Producto": "Servicio Atención Urgencias",
          "Cantidad": "1",
          "Precio Unitario": "1,03",
          "Impuesto Aplicado": "",
          "Subtotal": "1,03",
          "Precio Total": "1,03"
        },
        {
          "Producto": "Nortegas A PUNTO",
          "Cantidad": "1",
          "Precio Unitario": "12,89",
          "Impuesto Aplicado": "",
          "Subtotal": "12,89",
          "Precio Total": "12,89"
        },
        {
          "Producto": "Descuento Nortegas A PUNTO",
          "Cantidad": "1",
          "Precio Unitario": "-6,45",
          "Impuesto Aplicado": "",
          "Subtotal": "-6,45",
          "Precio Total": "-6,45"
        }
      ],
      "IVA": [
        {
          "Base imponible": "191,36",
          "Tipo de IVA": "21",
          "Importe de IVA": "40,19"
        }
      ],
      "Cuota Retención": "",
      "Tipo de Retención": "",
      "Importe Total Antes de Impuestos": "191,36",
      "Importe Total de Impuestos": "40,19",
      "Total a Pagar": "231,55",
      "Fecha de Vencimiento": "12.01.2022",
      "Método de Pago": "Domiciliado en BANCO PASTOR",
      "Detalles de Pago": "IBAN ES00720669000000000000000000000000",
      "file_id": "I02N211200023407_85539986-1746640903306-wvdvw4.pdf"
    
}
