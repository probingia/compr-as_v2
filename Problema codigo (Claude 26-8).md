PROBLEMAS CRÍTICOS (Claude 16:15, 26/8/2025)
1. Manejo Inconsistente de IDs
Ubicaciones afectadas:
•	state.js líneas ~23, ~95, ~147
•	events.js líneas ~176, ~310, ~345
•	api.js líneas ~110-120
Problemas específicos:
javascript
// INCONSISTENCIA 1: Tipos mixtos
// state.js - addCategory usa string:
id: Date.now().toString()

// state.js - addProduct usa number:
id: Date.now()

// events.js - asume siempre number:
const id = parseInt(document.getElementById('edit-producto-id').value);
const id = parseInt(item.dataset.id);
javascript
// INCONSISTENCIA 2: Comparaciones fallidas
// api.js - demo products usan integer calculado:
id: baseId + index  // number

// Pero luego se comparan con strings en algunos lugares
if (p.categoriaId === id) // string vs number
Casos de fallo:
•	Edición de productos falla si ID se convierte incorrectamente
•	Eliminación puede no encontrar el elemento correcto
•	Filtros y búsquedas pueden devolver resultados incorrectos
2. Lógica Rota en Búsqueda de Categorías
Ubicación:
•	events.js líneas ~39-44
Código problemático:
javascript
const handleInputProducto = (e) => {
    const valorInput = e.target.value;
    const nombreNormalizado = normalizar(valorInput);

    const categoriaSugerida = state.productoCategoriaMapNormalizado[nombreNormalizado];
    if (categoriaSugerida) {
        // ERROR: categoriaSugerida es un STRING, no un objeto con .id
        const categoria = state.mapaCategorias.get(categoriaSugerida.id);
        if (categoria) dom.categoriaProductoSelect.value = categoria.id;
    }
}
Problema raíz:
•	productoCategoriaMapNormalizado mapea nombres → nombres de categoría (strings)
•	El código trata categoriaSugerida como si fuera un objeto con propiedad .id
•	state.mapaCategorias usa IDs como claves, no nombres
Efecto:
•	Autocompletado de categorías completamente roto
•	Error JavaScript silencioso que impide funcionalidad
________________________________________
3. Dependencias Globales No Verificadas
Ubicaciones:
•	events.js líneas ~240-260 (html2canvas)
•	events.js líneas ~54-57 (webkitSpeechRecognition)
Código problemático:
javascript
// PROBLEMA 1: html2canvas sin verificación
const exportToJpg = (productos) => {
    // ... código de preparación ...
    
    // FALLA: Asume que html2canvas existe globalmente
    html2canvas(dom.listaComprasContainer, {
        scale: 2,
        backgroundColor: '#f8f9fa'
    }).then(canvas => {
        // ...
    }).finally(() => {
        // ...
    });
};
javascript
// PROBLEMA 2: Verificación incompleta de Speech Recognition
const handleBtnVozClick = () => {
    // Verifica existencia pero sigue usando API específica de WebKit
    if (!('webkitSpeechRecognition' in window)) {
        return mostrarNotificacion('El reconocimiento de voz no es compatible...', 'error');
    }
    
    // Usa API específica sin fallbacks
    const recognition = new webkitSpeechRecognition();
    // ...
};
Efectos:
•	Crash completo al intentar exportar a JPG si html2canvas no está cargada
•	Funcionalidad limitada a navegadores WebKit para reconocimiento de voz
________________________________________

🟠 PROBLEMAS ALTOS
4. Codificación de Caracteres Incorrecta (UTF-8)
Ubicaciones extensas:
•	state.js: ~15 ocurrencias
•	events.js: ~20 ocurrencias
•	api.js: ~8 ocurrencias
Caracteres mal codificados:
javascript
// ACENTOS Y EÑES:
'categorÃ¬a' → 'categoría'
'aÃ±adida' → 'añadida' 
'eliminarÃ¡' → 'eliminará'
'actualizaciÃ³n' → 'actualización'

// SÍMBOLOS:
'â‚¬' → '€'
'Â¿' → '¿'
'Â¡' → '¡'

// EJEMPLOS ESPECÍFICOS:
"El nombre de la categorÃ¬a no puede estar vacÃ¬o."
"CategorÃ¬a \"${nombreTrimmed}\" aÃ±adida."
"Â¿Seguro que quieres eliminar la categorÃ¬a \"${item.nombre}\"?"
Impacto:
•	Interfaz completamente ilegible para usuarios
•	Mensajes de error incomprensibles
•	Apariencia no profesional
•	Posibles problemas de SEO/accesibilidad
________________________________________
5. Inconsistencias en Estructura de Datos
Ubicaciones:
•	state.js líneas ~5-10 (definición)
•	state.js líneas ~28, ~76, ~118 (sincronización)
•	api.js líneas ~12-18 (buildMaps)
Problema estructural:
javascript
// DUPLICACIÓN PROBLEMÁTICA:
export const state = {
    productos: [],           // Array principal
    categorias: [],         // Array + Map duplicado
    tiendas: [],           // Array + Map duplicado
    mapaCategorias: new Map(),  // Redundante con categorias
    mapaTiendas: new Map(),     // Redundante con tiendas
};
Casos de desincronización:
javascript
// CASO 1: Eliminación manual de sincronización
export const deleteCategory = (id) => {
    state.mapaCategorias.delete(id);
    // PROBLEMA: Reconstruye todo el array desde el Map
    state.categorias = Array.from(state.mapaCategorias.values());
    // ¿Qué pasa si algo modifica state.categorias directamente?
};

// CASO 2: Construcción asimétrica
const buildMaps = () => {
    state.mapaCategorias.clear();
    state.categorias.forEach(cat => state.mapaCategorias.set(cat.id, cat));
    // PROBLEMA: ¿Qué es la fuente de verdad? ¿Array o Map?
};
Riesgos:
•	Datos desincronizados entre vistas
•	Comportamiento impredecible según el orden de operaciones
•	Dificultad para debuggear problemas de estado
________________________________________
6. Falta de Validaciones de Nulidad Críticas
Ubicaciones de alto riesgo:
•	events.js líneas ~280-320 (manejo de elementos DOM)
•	state.js líneas ~45-60, ~87-105 (operaciones con Maps)
•	events.js líneas ~100-140 (manipulación de productos)
Casos críticos:
javascript
// PROBLEMA 1: Operaciones DOM sin verificación
const handleListaComprasClick = (e) => {
    const item = e.target.closest('.producto-item');
    if (!item) return; // ✅ Bien
    const id = parseInt(item.dataset.id); // ❌ item.dataset puede ser null
    
    // ❌ Asume que encuentra el producto
    const producto = state.productos.find(p => p.id === id);
    // Sin verificación antes de usar producto.nombre
};

// PROBLEMA 2: Operaciones con Maps sin validación
const editCategory = (id, nuevoNombre) => {
    const item = state.mapaCategorias.get(id);
    if (!item) return { success: false, ... }; // ✅ Verifica existencia
    
    // ❌ Pero no verifica si otros elementos existen:
    if (Array.from(state.mapaCategorias.values()).some(c => 
        normalizar(c.nombre) === nombreNormalizado && c.id !== id)) {
        // Si c.nombre es undefined → crash en normalizar()
    }
};

// PROBLEMA 3: Elementos DOM asumidos
const abrirModalEdicion = (producto) => {
    // ❌ Asume que todos estos elementos DOM existen
    const catSelect = dom.editModalBody.querySelector('#edit-categoria-producto');
    renderSelect(catSelect, state.categorias, 'Elige...'); // crash si catSelect es null
};
Patrones de fallo:
•	Crash al interactuar con datos corruptos
•	Errors silenciosos que dejan la UI en estado inconsistente
•	Imposibilidad de diagnosticar problemas en producción
________________________________________
7. Gestión de Estado Global Peligrosa
Ubicación:
•	events.js líneas ~240-270 (exportToJpg)
Código problemático:
javascript
const exportToJpg = (productos) => {
    // PROBLEMA: Modifica estado global sin garantías de restauración
    const originalContent = dom.listaComprasContainer.innerHTML;
    const originalClassName = dom.listaComprasContainer.className;

    dom.listaComprasContainer.innerHTML = '';
    dom.listaComprasContainer.style.width = '900px'; // ❌ Modifica DOM global
    dom.listaComprasContainer.style.padding = '20px';
    
    renderProductos(productos, true);
    
    html2canvas(dom.listaComprasContainer, {
        scale: 2,
        backgroundColor: '#f8f9fa'
    }).then(canvas => {
        // ...
    }).finally(() => {
        // PROBLEMA: ¿Qué pasa si html2canvas falla antes del .finally()?
        dom.listaComprasContainer.innerHTML = originalContent;
        dom.listaComprasContainer.style.width = '';  // ❌ Puede no restaurarse
        dom.listaComprasContainer.style.padding = '';
        render(); // ❌ Re-render completo puede ser costoso
    });
};
Riesgos:
•	Layout permanentemente roto si la exportación falla
•	Estado visual inconsistente
•	Efectos secundarios que afectan otras funcionalidades
________________________________________
8. Manejo de Arrays con Mutaciones Directas
Ubicaciones:
•	api.js líneas ~110-130 (addDemoProducts)
•	state.js líneas ~123, ~152 (updateProduct, deleteProduct)
Patrón problemático:
javascript
// PROBLEMA: Mutación directa de arrays compartidos
state.productos.forEach(p => {
    if (p.categoriaId === id) {
        p.categoriaId = ''; // ❌ Mutación directa sin notificación
    }
});

// PROBLEMA: Filtrado que puede generar problemas de referencia
const deleteProduct = (id) => {
    const initialLength = state.productos.length;
    state.productos = state.productos.filter(p => p.id !== id); // ❌ Nueva referencia
    // Componentes que mantengan referencia al array anterior quedarán obsoletos
};
Efectos:
•	Componentes que no se re-renderizan
•	Estado inconsistente entre diferentes partes de la aplicación
•	Dificultad para implementar undo/redo o tracking de cambios


🟡 PROBLEMAS MEDIOS
9. Uso de APIs No Accesibles y Deprecated
Ubicaciones:
•	events.js líneas ~334, ~352 (prompt)
•	events.js líneas ~54-57 (webkitSpeechRecognition)
Problemas específicos:
A. Uso de prompt() - No accesible
javascript
// PROBLEMA: API no accesible y pobre UX
const handleGestionClick = (e) => {
    // ...
    if (target.classList.contains('btn-editar-categoria')) {
        // ❌ prompt() bloquea el hilo principal y no es accesible
        const nuevoNombre = prompt(`Editar nombre de la categoría:`, item.nombre);
        if (nuevoNombre) {
            const result = editCategory(id, nuevoNombre);
            // ...
        }
    }
    // Mismo patrón se repite para tiendas
};
Problemas del prompt():
•	No funciona con lectores de pantalla
•	Bloquea completamente la UI
•	Estilo no personalizable (inconsistente con el diseño)
•	No permite validación en tiempo real
•	Puede ser bloqueado por algunos navegadores
B. API específica de WebKit
javascript
// PROBLEMA: Dependencia de API específica de navegador
const handleBtnVozClick = () => {
    if (!('webkitSpeechRecognition' in window)) {
        return mostrarNotificacion('El reconocimiento de voz no es compatible...', 'error');
    }
    // Solo funciona en Chrome/Safari, no hay fallback para Firefox/Edge
    const recognition = new webkitSpeechRecognition();
};
Impacto:
•	Funcionalidad limitada para usuarios con discapacidades
•	UX inconsistente entre navegadores
•	Experiencia frustrante en navegadores no-WebKit
________________________________________
(actual) 
10. Manejo Inseguro de Estilos y DOM Global
Ubicaciones:
•	events.js líneas ~240-270 (exportToJpg)
•	events.js líneas ~402-406 (rangoTamanoLetra)
Problemas específicos:
A. Modificación temporal de estilos globales
javascript
const exportToJpg = (productos) => {
    // PROBLEMA: Modificaciones que pueden no revertirse correctamente
    const originalContent = dom.listaComprasContainer.innerHTML;
    const originalClassName = dom.listaComprasContainer.className;

    dom.listaComprasContainer.innerHTML = '';
    dom.listaComprasContainer.style.width = '900px';    // ❌ Inline styles
    dom.listaComprasContainer.style.padding = '20px';  // ❌ Pueden persistir
    
    // ❌ Si html2canvas lanza excepción antes del .finally(), estilos no se restauran
    html2canvas(dom.listaComprasContainer, {
        scale: 2,
        backgroundColor: '#f8f9fa'
    }).then(canvas => {
        // ...
    }).finally(() => {
        // PROBLEMA: Restauración manual propensa a errores
        dom.listaComprasContainer.innerHTML = originalContent;
        dom.listaComprasContainer.className = originalClassName;
        dom.listaComprasContainer.style.width = '';     // ❌ Puede fallar
        dom.listaComprasContainer.style.padding = '';
        render(); // ❌ Re-render completo innecesario
    });
};
B. Manipulación directa de CSS custom properties
javascript
// PROBLEMA: Modificación de CSS variables globales sin encapsulación
dom.rangoTamanoLetra.addEventListener('input', (e) => {
    const nuevoTamanio = e.target.value;
    // ❌ Modifica variable CSS global directamente
    document.documentElement.style.setProperty('--font-size-base', `${nuevoTamanio}px`);
    localStorage.setItem('fontSize', nuevoTamanio);
});
Riesgos:
•	Layout roto permanentemente tras operaciones fallidas
•	Estilos inline que sobrescriben CSS y causan problemas de especificidad
•	Efectos visuales no deseados que persisten entre operaciones
________________________________________
11. Código Duplicado Extenso y Patrón Repetitivo
Ubicaciones masivas:
•	state.js líneas ~15-50 vs ~65-95 vs ~107-135 (CRUD categorías/tiendas/productos)
•	events.js líneas ~320-340 vs ~340-360 (manejo de categorías vs tiendas)
Duplicación crítica:
A. Lógica CRUD casi idéntica
javascript
// PATRÓN REPETIDO 1: Add functions
export const addCategory = (nombre) => {
    const nombreTrimmed = nombre.trim();
    if (!nombreTrimmed) {
        return { success: false, message: 'El nombre de la categoría no puede estar vacío.' };
    }
    const nombreNormalizado = normalizar(nombreTrimmed);
    if (state.categorias.some(c => normalizar(c.nombre) === nombreNormalizado)) {
        return { success: false, message: `La categoría "${nombreTrimmed}" ya existe.` };
    }
    // ... resto de lógica casi idéntica
};

export const addStore = (nombre) => {
    const nombreTrimmed = nombre.trim();
    if (!nombreTrimmed) {
        return { success: false, message: 'El nombre de la tienda no puede estar vacío.' }; // Solo cambia "tienda"
    }
    const nombreNormalizado = normalizar(nombreTrimmed);
    if (Array.from(state.mapaTiendas.values()).some(t => normalizar(t.nombre) === nombreNormalizado)) {
        return { success: false, message: `La tienda "${nombreTrimmed}" ya existe.` }; // Solo cambia "tienda"
    }
    // ... resto EXACTAMENTE igual
};
B. Event handlers duplicados
javascript
// PATRÓN REPETIDO 2: Manejo de eventos casi idéntico
const handleGestionClick = (e) => {
    // ... código común ...
    
    if (isCategoria) {
        if (target.classList.contains('btn-eliminar-categoria')) {
            mostrarConfirmacion(`¿Seguro que quieres eliminar la categoría "${item.nombre}"?`, () => {
                const result = deleteCategory(id);
                if (result.success) {
                    li.remove();
                    render();
                }
                mostrarNotificacion(result.message, result.success ? 'success' : 'error');
            });
        } else if (target.classList.contains('btn-editar-categoria')) {
            const nuevoNombre = prompt(`Editar nombre de la categoría:`, item.nombre);
            // ... lógica duplicada
        }
    } else { // Es una tienda - CÓDIGO CASI IDÉNTICO
        if (target.classList.contains('btn-eliminar-tienda')) {
            mostrarConfirmacion(`¿Seguro que quieres eliminar la tienda "${item.nombre}"?`, () => {
                const result = deleteStore(id);
                // ... misma lógica exacta
            });
        }
        // ... más duplicación
    }
};
C. Validaciones repetitivas
javascript
// PATRÓN REPETIDO 3: Validaciones idénticas en múltiples lugares
// En handleGuardarEdicion:
const nombre = capitalizar(document.getElementById('edit-nombre-producto').value.trim());
if (!nombre) {
    return mostrarNotificacion('El nombre del producto es obligatorio.', 'error');
}

const cantidadStr = document.getElementById('edit-cantidad-producto').value.trim();
let cantidad;
if (cantidadStr === '') {
    cantidad = 1;
} else {
    cantidad = parseFloat(cantidadStr);
    if (isNaN(cantidad) || cantidad <= 0) {
        return mostrarNotificacion('La cantidad debe ser un número positivo.', 'error');
    }
}

// En handleAnadirProducto - EXACTAMENTE LA MISMA LÓGICA:
const nombre = capitalizar(dom.nombreProductoInput.value.trim());
if (!nombre) {
    return mostrarNotificacion('El nombre del producto es obligatorio.', 'error');
}
// ... mismas validaciones repetidas
Impacto:
•	Código 3x más largo de lo necesario
•	Bugs se replican en múltiples lugares
•	Cambios requieren modificar múltiples ubicaciones
•	Mantenimiento extremadamente costoso
________________________________________
12. Gestión de Eventos Ineficiente
Ubicaciones:
•	events.js líneas ~410-430 (event listeners)
•	events.js líneas ~35-50 (handleInputProducto)
Problemas específicos:
A. Event listeners sin cleanup
javascript
// PROBLEMA: Listeners globales sin mecanismo de cleanup
export function setupEventListeners() {
    dom.unidadProductoSelect.addEventListener('change', actualizarLabelPrecio);
    dom.btnAnadir.addEventListener('click', handleAnadirProducto);
    dom.nombreProductoInput.addEventListener('input', handleInputProducto);
    // ... 20+ listeners más
    
    // ❌ No hay función de cleanup correspondiente
    // ❌ Si se llama múltiples veces, se acumulan listeners
}
B. Delegación de eventos incompleta
javascript
// PROBLEMA: Algunos eventos usan delegación, otros no
dom.listaComprasContainer.addEventListener('click', handleListaComprasClick); // ✅ Delegación
dom.btnAnadir.addEventListener('click', handleAnadirProducto); // ❌ Directo

// INCONSISTENCIA: Mezcla de patrones
dom.exportSelectionBody.addEventListener('click', handleExportarSeleccionarTodo); // ✅ Delegación
dom.btnConfirmarExportacion.addEventListener('click', handleConfirmarExportacion); // ❌ Directo
C. Handling de eventos sin debouncing
javascript
// PROBLEMA: Input handler se ejecuta en cada keystroke
const handleInputProducto = (e) => {
    const valorInput = e.target.value;
    const nombreNormalizado = normalizar(valorInput);

    // ❌ Se ejecuta en CADA tecla presionada
    if (valorInput.length > 0) {
        const sugerenciasFiltradas = state.listaAutocompletado.filter(p => 
            normalizar(p).startsWith(nombreNormalizado)
        ).slice(0, 10);
        renderSugerencias(sugerenciasFiltradas); // ❌ Re-render en cada keystroke
    }
};
Impacto:
•	Memory leaks potenciales
•	Performance degradada con listas grandes
•	Comportamiento inconsistente de la UI
________________________________________

🟢 PROBLEMAS BAJOS
13. Problemas de Performance y Optimización
Ubicaciones:
•	events.js líneas ~35-50 (búsqueda sin debouncing)
•	state.js líneas ~125-135 (operaciones de array ineficientes)
•	events.js líneas ~200-220 (re-renders innecesarios)
Problemas específicos:
A. Búsqueda sin debouncing
javascript
// PROBLEMA: Operaciones costosas en cada keystroke
const handleInputProducto = (e) => {
    const valorInput = e.target.value;
    const nombreNormalizado = normalizar(valorInput); // ❌ Normalización en cada keystroke

    // ❌ Filtrado completo del array en cada keystroke
    if (valorInput.length > 0) {
        const sugerenciasFiltradas = state.listaAutocompletado.filter(p => 
            normalizar(p).startsWith(nombreNormalizado) // ❌ Normalización O(n) por keystroke
        ).slice(0, 10);
        renderSugerencias(sugerenciasFiltradas); // ❌ DOM manipulation por keystroke
    }
    
    // ❌ Búsqueda en map en cada keystroke
    const categoriaSugerida = state.productoCategoriaMapNormalizado[nombreNormalizado];
};
B. Operaciones de array ineficientes
javascript
// PROBLEMA: Búsquedas lineales repetidas
dom.busquedaInput.addEventListener('input', renderProductos);
dom.filtroTiendaSelect.addEventListener('change', renderProductos);

// renderProductos probablemente hace:
const productosFiltrados = state.productos.filter(p => {
    // ❌ Múltiples operaciones O(n) que podrían optimizarse
    const tienda = state.mapaTiendas.get(p.tiendaId); // O(1) - bien
    const categoria = state.mapaCategorias.get(p.categoriaId); // O(1) - bien
    
    // Pero si hay filtros múltiples, se re-filtra todo el array cada vez
});
C. Re-renders completos innecesarios
javascript
// PROBLEMA: Re-render completo cuando solo cambia una parte
const toggleProductStatus = (id) => {
    const producto = state.productos.find(p => p.id === id);
    if (!producto) return { success: false, message: 'Producto no encontrado.' };
    
    producto.comprado = !producto.comprado;
    // ❌ Debería solo actualizar el elemento específico, no toda la lista
    return { success: true, data: { comprado: producto.comprado } };
};

// En el handler:
if (e.target.closest('.check-comprado')) {
    const result = toggleProductStatus(id);
    if (result.success) {
        item.classList.toggle('comprado', result.data.comprado); // ✅ Actualización local
        renderTotales(); // ❌ Pero también re-calcula totales completos
    }
}
Impacto con datos grandes:
•	Lag notable con >500 productos
•	UI que se congela durante búsquedas
•	Consumo excesivo de CPU en mobile
________________________________________
14. Manejo de Errores Incompleto y Logging Deficiente
Ubicaciones:
•	api.js líneas ~30-50 (cargarDatosIniciales)
•	events.js múltiples funciones sin try-catch
•	Falta de logging estructurado en toda la aplicación
Problemas específicos:
A. Manejo de errores inconsistente
javascript
// PROBLEMA: Algunos lugares manejan errores, otros no
export const cargarDatosIniciales = async () => {
    try {
        const productosResponse = await fetch('productos.json');
        if (!productosResponse.ok) throw new Error(`HTTP error! status: ${productosResponse.status}`);
        // ✅ Manejo correcto aquí
    } catch (error) {
        console.error("Error fatal al cargar datos iniciales:", error);
        mostrarNotificacion("No se pudieron cargar los datos iniciales...", 'error');
        throw error; // ❌ Re-lanza pero quien lo llama no lo maneja
    }
};

// PERO luego:
const handleAnadirProducto = () => {
    // ❌ Sin try-catch, cualquier error crashea la función
    const nombre = capitalizar(dom.nombreProductoInput.value.trim());
    // Si capitalizar() falla, toda la función se rompe
};
B. Errores silenciosos
javascript
// PROBLEMA: Errores que no se reportan al usuario
const handleInputProducto = (e) => {
    const valorInput = e.target.value;
    const nombreNormalizado = normalizar(valorInput);

    const categoriaSugerida = state.productoCategoriaMapNormalizado[nombreNormalizado];
    if (categoriaSugerida) {
        // ❌ Si esto falla, el error es silencioso
        const categoria = state.mapaCategorias.get(categoriaSugerida.id);
        if (categoria) dom.categoriaProductoSelect.value = categoria.id;
    }
    // Usuario nunca sabe por qué la autocompletación no funciona
};
C. Falta de logging para debugging
javascript
// PROBLEMA: Difícil diagnosticar problemas en producción
export const updateProduct = (id, productData) => {
    const producto = state.productos.find(p => p.id === id);
    if (!producto) {
        // ❌ No hay logging de qué ID se buscó, cuántos productos hay, etc.
        return { success: false, message: 'Producto no encontrado.' };
    }
    // ❌ No se registra qué campos se actualizaron
    Object.assign(producto, productData);
};
Impacto:
•	Debugging extremadamente difícil
•	Usuarios frustrados por errores silenciosos
•	Imposible diagnosticar problemas reportados por usuarios
________________________________________
15. Inconsistencias de Formato y Convenciones
Ubicaciones:
•	Toda la base de código tiene inconsistencias menores pero sistemáticas
Problemas específicos:
A. Naming conventions inconsistentes
javascript
// INCONSISTENCIA 1: camelCase vs snake_case
const mapaCategorias = new Map(); // camelCase español
const productoCategoriaMapNormalizado = {}; // camelCase largo
const listaAutocompletado = []; // camelCase español

// Pero luego:
dom.exportImportModal // camelCase inglés
dom.btnAnadir // camelCase español truncado
B. Estructura de retorno inconsistente
javascript
// INCONSISTENCIA 2: Diferentes formatos de respuesta
// Algunas funciones:
return { success: true, data: nuevaCategoria, message: `Categoría "${nombreTrimmed}" añadida.` };

// Otras funciones:
return { success: true, changed: true, message: 'Categoría actualizada.' };

// Otras:
return { success: true, data: { comprado: producto.comprado } }; // Sin mensaje
C. Comentarios y documentación inconsistentes
javascript
// INCONSISTENCIA 3: Algunos comentarios en inglés, otros en español
// --- CATEGORY MANAGEMENT --- (inglés)
// ... código ...
// PROBLEMA: Modificación temporal de estilos globales (español)

/**
 * Saves the current application state to IndexedDB. (inglés)
 * @returns {Promise<void>}
 */
export const guardarEstado = async () => { // función en español
Impacto menor pero acumulativo:
•	Código difícil de leer para nuevos desarrolladores
•	Confusión sobre convenciones a seguir
•	Apariencia no profesional del código
________________________________________
16. Dependencias de APIs Modernas sin Polyfills
Ubicaciones:
•	events.js uso de APIs modernas sin verificación
•	Métodos de Array/Object relativamente nuevos
Problemas específicos:
A. APIs sin verificación de compatibilidad
javascript
// PROBLEMA: Uso de APIs que pueden no estar disponibles
// Array.from() - IE no lo soporta
state.categorias = Array.from(state.mapaCategorias.values());

// Object.assign() - Necesita polyfill en IE
Object.assign(producto, productData);

// Promise.finally() - Relativamente nuevo
html2canvas(...).then(...).finally(() => {
    // ❌ No todos los navegadores antiguos lo soportan
});

// FileReader API - Asumida sin verificación
reader.readAsText(file, 'UTF-8');
B. CSS features modernas
javascript
// PROBLEMA: CSS custom properties sin fallback
document.documentElement.style.setProperty('--font-size-base', `${nuevoTamanio}px`);
// ❌ IE no soporta CSS custom properties
Impacto limitado:
•	Funcionalidad reducida en navegadores antiguos
•	Posibles errores en entornos corporativos con navegadores legacy
________________________________________
17. Gestión de Memoria y Cleanup Deficiente
Ubicaciones:
•	events.js - event listeners sin cleanup
•	Variables globales que pueden crecer indefinidamente
Problemas específicos:
A. Event listeners acumulativos
javascript
// PROBLEMA: Si setupEventListeners() se llama múltiples veces
export function setupEventListeners() {
    // ❌ Cada llamada añade listeners adicionales sin remover los anteriores
    dom.btnAnadir.addEventListener('click', handleAnadirProducto);
    dom.nombreProductoInput.addEventListener('input', handleInputProducto);
    
    // MEJOR SERÍA:
    // dom.btnAnadir.removeEventListener('click', handleAnadirProducto);
    // dom.btnAnadir.addEventListener('click', handleAnadirProducto);
}
B. Referencias que pueden prevenir garbage collection
javascript
// PROBLEMA: Variables de módulo que mantienen referencias
let productosAImportar = []; // Variable de módulo
let elementoQueDisparoElModal = null; // Mantiene referencia DOM

// ❌ Estas nunca se limpian, pueden acumular memoria
C. Closures con referencias pesadas
javascript
// PROBLEMA: Closures que capturan todo el scope
const handleConfirmarImportacion = () => {
    // ❌ Este closure captura todo el módulo, incluyendo productosAImportar
    const checkboxes = dom.importPreviewBody.querySelectorAll('.import-item-check:checked');
    // ... usa productosAImportar
    // Si este handler se mantiene en memoria, todo el array también
};
Impacto en uso prolongado:
•	Consumo de memoria que crece con el tiempo
•	Posible degradación de performance
•	En casos extremos, crash por falta de memoria



