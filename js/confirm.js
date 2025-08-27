const confirmModalEl = document.getElementById('confirmModal');
const confirmModal = new bootstrap.Modal(confirmModalEl);
const confirmModalBody = document.getElementById('confirmModalBody');
const confirmModalOk = document.getElementById('confirmModalOk');
const confirmModalCancel = document.getElementById('confirmModalCancel');

/**
 * Muestra un modal de confirmación genérico.
 * @param {string} message - El mensaje o pregunta a mostrar en el modal.
 * @param {function} onConfirm - La función callback que se ejecutará si el usuario hace clic en "Aceptar".
 */
export const mostrarConfirmacion = (message, onConfirm) => {
    // Establecer el mensaje del modal
    confirmModalBody.textContent = message;

    // Mostrar el modal
    confirmModal.show();

    // Manejar el clic en el botón "Aceptar"
    confirmModalOk.onclick = () => {
        confirmModal.hide();
        onConfirm();
    };

    // Manejar el clic en el botón "Cancelar"
    confirmModalCancel.onclick = () => {
        confirmModal.hide();
    };
};