import { capitalizar, normalizar } from './utils.js';

/**
 * Parsea el contenido de texto de un archivo importado y lo convierte en una lista de productos.
 * @param {string} texto - El contenido de texto del archivo.
 * @param {object} state - El estado de la aplicación para buscar categorías y tiendas.
 * @returns {{productosParseados: Array, lineasConError: Array}} - Un objeto con los productos y los errores.
 */
export const parsearTextoImportado = (texto, state) => {
    const lineas = texto.split('\n');
    const productosParseados = [];
    const lineasConError = [];

    lineas.forEach((linea, index) => {
        linea = linea.trim();
        if (!linea) return;

        try {
            if (!linea.startsWith('[') || !linea.includes(']')) {
                throw new Error("La línea debe empezar con [ ] o [x].");
            }

            const comprado = linea.substring(1, 2).toLowerCase() === 'x';
            let lineaRestante = linea.substring(linea.indexOf(']') + 1).trim();
            
            if (!lineaRestante) {
                throw new Error("No se encontró nombre de producto.");
            }

            // 1. Extraer notas (formato: (Nota: ...))
            let notas = '';
            const matchNotas = lineaRestante.match(/\(Nota:\s*(.*?)\)$/);
            if (matchNotas) {
                notas = matchNotas[1].trim();
                lineaRestante = lineaRestante.substring(0, matchNotas.index).trim();
            }

            // 2. Extraer prioridad (formato: (Prioridad: ...))
            let prioridad = 'baja';
            const matchPrioridad = lineaRestante.match(/\(Prioridad:\s*(.*?)\)$/);
            if (matchPrioridad) {
                const prioridadParseada = matchPrioridad[1].trim().toLowerCase();
                if (['alta', 'media', 'baja'].includes(prioridadParseada)) {
                    prioridad = prioridadParseada;
                }
                lineaRestante = lineaRestante.substring(0, matchPrioridad.index).trim();
            }

            // 3. Extraer precio (formato: - 1.23€)
            let precioTotalCalculado = 0;
            const matchPrecio = lineaRestante.match(/(?:-\s*)(\d*\.?\d+)\s*€?$/);
            if (matchPrecio) {
                precioTotalCalculado = parseFloat(matchPrecio[1]) || 0;
                lineaRestante = lineaRestante.substring(0, matchPrecio.index).trim();
            }

            // 4. Extraer tienda (formato: @ Tienda)
            let tiendaStr = '';
            const matchTienda = lineaRestante.match(/(?:@\s*)(.+)$/);
            if (matchTienda) {
                tiendaStr = matchTienda[1].trim();
                lineaRestante = lineaRestante.substring(0, matchTienda.index).trim();
            }

            // 5. Extraer cantidad y unidad (formato: (1 kg))
            let cantidad = 1;
            let unidad = 'ud';
            const matchCantidad = lineaRestante.match(/\((\d*\.?\d+)\s*(\w+)\)$/);
             if (matchCantidad) {
                const cantidadParseada = parseFloat(matchCantidad[1]);
                if (!isNaN(cantidadParseada)) {
                    cantidad = cantidadParseada;
                    unidad = matchCantidad[2] || 'ud';
                    lineaRestante = lineaRestante.substring(0, matchCantidad.index).trim();
                }
            }

            // 6. Lo que queda es el nombre
            const nombre = capitalizar(lineaRestante);
            if (!nombre) {
                throw new Error("El nombre del producto no puede estar vacío.");
            }

            // 7. Buscar IDs de categoría y tienda
            const categoriaNombre = state.productoCategoriaMapNormalizado[normalizar(nombre)];
            const categoria = Array.from(state.mapaCategorias.values()).find(c => c.nombre === categoriaNombre);
            const tienda = Array.from(state.mapaTiendas.values()).find(t => tiendaStr && normalizar(t.nombre) === normalizar(tiendaStr));

            productosParseados.push({
                nombre,
                cantidad,
                unidad,
                precioTotalCalculado,
                categoriaId: categoria ? categoria.id : '',
                categoriaNombre: categoria ? categoria.nombre : 'Sin categoría',
                precioUnitario: (cantidad > 0 ? precioTotalCalculado / cantidad : 0),
                tiendaId: tienda ? tienda.id : '',
                tiendaNombre: tienda ? tienda.nombre : 'Sin asignar',
                notas: notas,
                comprado,
                prioridad,
                importado: true
            });

        } catch (error) {
            lineasConError.push({ num: index + 1, contenido: linea, error: error.message });
        }
    });

    return { productosParseados, lineasConError };
};