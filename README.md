# Compr-As: Tu Lista de Compras Inteligente

Compr-As es una aplicación web progresiva (PWA) diseñada para ser una herramienta moderna, rápida y eficiente para gestionar tus listas de la compra. Funciona offline y está pensada para ser intuitiva y fácil de usar.

## ✨ Características Principales

*   **Gestión Completa de Productos:** Añade, edita, elimina y marca productos como comprados con detalles como cantidad, precio unitario, tienda, categoría, prioridad y notas.
*   **Clasificación Inteligente:** La aplicación aprende las categorías que asignas a los productos nuevos para auto-clasificarlos en el futuro.
*   **Autocompletado:** Sugerencias de productos basadas en una lista predefinida y en los productos que has añadido manualmente.
*   **Panel de Gestión:**
    *   Gestiona tus propias listas de **Categorías** y **Tiendas**.
    *   Gestiona la lista de **Autocompletado**, eliminando o editando los productos que ya no necesites.
*   **Importación y Exportación Avanzada:**
    *   Exporta tu lista de la compra a formatos **.txt**, **.jpg** o **.pdf**.
    *   Importa listas de productos desde ficheros **.txt**, con previsualización y selección de los productos a importar.
*   **Búsqueda y Filtrado:** Filtra tu lista por tienda, prioridad o búsqueda de texto libre.
*   **Cálculos Automáticos:** La aplicación calcula el coste total de tu compra y el número de productos.
*   **Interfaz Adaptable (Responsive):** Funciona en cualquier tamaño de pantalla, desde móviles a escritorio.
*   **Soporte Offline (PWA):** Gracias al Service Worker, la aplicación puede usarse sin conexión a internet una vez ha sido cargada.

## 🛠️ Tecnologías Utilizadas

*   **Frontend:** HTML5, CSS3, JavaScript (ES6 Modules)
*   **Framework de UI:** Bootstrap 5
*   **Librerías Externas:**
    *   **jsPDF:** para la generación de documentos PDF.
    *   **html2canvas:** para la generación de imágenes JPG.
*   **Almacenamiento:** IndexedDB para la persistencia de datos en el navegador.

## 🚀 Cómo Empezar

Simplemente abre el fichero `index.html` en cualquier navegador web moderno.

No requiere instalación ni un servidor. La aplicación es completamente autocontenida y se ejecuta en el lado del cliente.

## 📂 Estructura del Proyecto

```
/
├── css/
│   └── style.css         # Estilos personalizados
├── js/
│   ├── api.js            # Carga de datos iniciales y desde DB
│   ├── app.js            # Punto de entrada principal
│   ├── confirm.js        # Lógica del modal de confirmación
│   ├── db.js             # Gestión de la base de datos IndexedDB
│   ├── dom.js            # Referencias a los elementos del DOM
│   ├── events.js         # Manejadores de eventos
│   ├── importParser.js   # Lógica para importar desde .txt
│   ├── notifications.js  # Sistema de notificaciones
│   ├── pdfGenerator.js   # Lógica para generar PDFs
│   ├── render.js         # Funciones que dibujan en el DOM
│   ├── state.js          # Estado central de la aplicación
│   └── utils.js          # Funciones de utilidad
├── libs/                 # Librerías de terceros (Bootstrap, jsPDF, etc.)
├── index.html            # Fichero principal de la aplicación
├── productos.json        # Datos iniciales de productos y categorías
├── tiendas.json          # Datos iniciales de tiendas
├── manifest.json         # Manifiesto de la PWA
├── sw.js                 # Service Worker para la funcionalidad offline
└── README.md             # Este fichero
```

## 🔮 Mejoras Futuras

*   Sincronización de datos entre dispositivos a través de un backend.
*   Notificaciones push para recordatorios.
*   Internacionalización (traducción a otros idiomas).