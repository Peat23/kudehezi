document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const newActionButton = document.querySelector('#new-action-btn');
    const actionForm = document.querySelector('#action-form');
    const cancelFormBtn = document.querySelector('#cancel-form');
    const accionForm = document.querySelector('#accion-form');
    const actionsBody = document.querySelector('#actions-body');
    
    
    // Variables de estado
    let currentEditingId = null;
    let originalAcciones = []; // Pour stocker les données originales

    // Función para crear una notificación toast
    function showToast(message, type = 'success', duration = 3000) {
        // Crear el elemento toast
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            ${message}
            <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
        `;
        
        // Añadir al body
        document.body.appendChild(toast);
        
        // Mostrar con animación
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        // Eliminar después de la duración especificada
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        }, duration);
    }

    // Función para aplicar filtros
    async function aplicarFiltros() {
        const fechaDesde = document.getElementById('fecha-desde').value;
        const fechaHasta = document.getElementById('fecha-hasta').value;
        const nombre = document.getElementById('buscar-nombre').value;
        const tipo = document.getElementById('filtro-tipo').value;
        const ordenarPor = document.getElementById('ordenar-por').value;

        // Construir URL con parámetros
        const params = new URLSearchParams();
        if (fechaDesde) params.append('fechaDesde', fechaDesde);
        if (fechaHasta) params.append('fechaHasta', fechaHasta);
        if (nombre) params.append('nombre', nombre);
        if (tipo) params.append('tipo', tipo);
        if (ordenarPor) params.append('ordenarPor', ordenarPor);

        try {
            const response = await fetch(`/api/acciones?${params.toString()}`);
            const acciones = await response.json();
            actualizarTabla(acciones);
        } catch (error) {
            console.error('Error al aplicar filtros:', error);
            showToast('❌ Error al aplicar filtros', 'error');
        }
    }

    // Función para actualizar la tabla
    function actualizarTabla(acciones) {
        const tbody = document.getElementById('actions-body');
        tbody.innerHTML = '';

        acciones.forEach(accion => {
            const tiposTexto = {
                consulta: "Consulta",
                jornada: "Jornada",
                reunion: "Reunión",
                formacion: "Formación",
                otros: "Otros"
            };

            const hasDetails = (accion.descripcion && accion.descripcion.trim()) || 
                             (accion.web && accion.web.trim());

            // Fila principal
            const mainRow = document.createElement('tr');
            mainRow.dataset.id = accion._id;
            mainRow.innerHTML = `
                <td>
                    ${hasDetails ? '<span class="action-icon toggle-details" title="Ver detalles">▼</span>' : ''}
                    <span class="action-name">${accion.nombre}</span>
                </td>
                <td>${accion.entidad}</td>
                <td>${accion.email}</td>
                <td>${accion.telefono}</td>
                <td>${new Date(accion.fechaInicio).toLocaleDateString('es-ES')}</td>
                <td>${new Date(accion.fechaFin).toLocaleDateString('es-ES')}</td>
                <td>${accion.horarios}</td>
                <td>${tiposTexto[accion.tipo] || accion.tipo}</td>
                <td>${accion.responsables.join(', ')}</td>
                <td>
                    <span class="action-icon edit-icon" title="Editar">✏️</span>
                    <span class="action-icon delete-icon" title="Eliminar">🗑️</span>
                </td>
            `;
            tbody.appendChild(mainRow);

            // Fila de detalles
            if (hasDetails) {
                const detailsRow = document.createElement('tr');
                detailsRow.className = 'details-row';
                detailsRow.style.display = 'none';
                
                let detailsContent = '<div class="details-content">';
                if (accion.descripcion && accion.descripcion.trim()) {
                    detailsContent += `<p><strong>Descripción:</strong><br>${accion.descripcion.replace(/\n/g, '<br>')}</p>`;
                }
                if (accion.web && accion.web.trim()) {
                    detailsContent += `<p><strong>Web:</strong> <a href="${accion.web}" target="_blank" rel="noopener noreferrer">${accion.web}</a></p>`;
                }
                detailsContent += '</div>';

                detailsRow.innerHTML = `<td colspan="10">${detailsContent}</td>`;
                tbody.appendChild(detailsRow);
            }
        });
    }

    // Función para limpiar filtros
    function limpiarFiltros() {
        document.getElementById('fecha-desde').value = '';
        document.getElementById('fecha-hasta').value = '';
        document.getElementById('buscar-nombre').value = '';
        document.getElementById('filtro-tipo').value = '';
        document.getElementById('ordenar-por').value = 'fechaInicio-desc';
        aplicarFiltros();
    }

    // Mostrar el formulario
    newActionButton.addEventListener('click', () => {
        actionForm.classList.add('show');
        document.querySelector('.main-content').classList.add('form-open');
        currentEditingId = null;
        accionForm.reset();
        document.querySelector('#form-title').textContent = 'Nueva Acción';
    });

    // Ocultar el formulario
    cancelFormBtn.addEventListener('click', () => {
        actionForm.classList.remove('show');
        document.querySelector('.main-content').classList.remove('form-open');
    });

    // Envío del formulario
    accionForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Recuperación de los datos
        const formData = {
            nombre: document.querySelector('#nombre').value,
            entidad: document.querySelector('#asociacionEntidad').value,
            email: document.querySelector('#email').value,
            telefono: document.querySelector('#telefono').value,
            fechaInicio: document.querySelector('#fechaInicio').value,
            fechaFin: document.querySelector('#fechaFin').value,
            horarios: document.querySelector('#horarios').value,
            tipo: document.querySelector('#tipoAccion').value,
            descripcion: document.querySelector('#descripcion').value,
            web: document.querySelector('#web').value,
            responsables: Array.from(
                document.querySelectorAll('input[name="responsableAccion"]:checked')
            ).map(cb => cb.value)
        };

        try {
            if (currentEditingId) {
                // Actualización
                const response = await fetch(`/acciones/${currentEditingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                const result = await response.json();
                if (result.success) {
                    showToast('✅ Acción actualizada correctamente', 'success');
                    // Cerrar el formulario
                    actionForm.classList.remove('show');
                    document.querySelector('.main-content').classList.remove('form-open');
                    // Recargar la tabla con los filtros actuales
                    setTimeout(() => aplicarFiltros(), 500);
                } else {
                    showToast('❌ Error al actualizar la acción', 'error');
                }
            } else {
                // Creación
                const response = await fetch('/acciones', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                const result = await response.json();
                if (result.id) {
                    showToast('✅ Nueva acción añadida correctamente', 'success');
                    // Cerrar el formulario
                    actionForm.classList.remove('show');
                    document.querySelector('.main-content').classList.remove('form-open');
                    // Recargar la tabla con los filtros actuales
                    setTimeout(() => aplicarFiltros(), 500);
                } else {
                    showToast('❌ Error al crear la acción', 'error');
                }
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('❌ Error al guardar la acción', 'error');
        }
    });

    // Modal de eliminación
    const deleteModal = document.getElementById('delete-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    let rowToDelete = null;
    let actionIdToDelete = null;

    // Listeners para las acciones
    actionsBody.addEventListener('click', async (e) => {
        const row = e.target.closest('tr');
        if (!row) return;

        const actionId = row.dataset.id;
        
        // Edición
        if (e.target.classList.contains('toggle-details')) {
            const detailsRow = row.nextElementSibling;
            if (detailsRow && detailsRow.classList.contains('details-row')) {
                const isVisible = detailsRow.style.display !== 'none';
                detailsRow.style.display = isVisible ? 'none' : 'table-row';
                e.target.classList.toggle('open', !isVisible);
            }
            // On arrête ici pour ne pas déclencher d'autres actions si on clique sur la flèche
            return;
        }
        
        // Edición
        if (e.target.classList.contains('edit-icon')) {
            try {
                const response = await fetch(`/acciones/${actionId}`);
                const accion = await response.json();
                
                // Rellenar el formulario
                document.querySelector('#nombre').value = accion.nombre;
                document.querySelector('#asociacionEntidad').value = accion.entidad;
                document.querySelector('#email').value = accion.email;
                document.querySelector('#telefono').value = accion.telefono;
                document.querySelector('#fechaInicio').value = accion.fechaInicio.split('T')[0];
                document.querySelector('#fechaFin').value = accion.fechaFin.split('T')[0];
                document.querySelector('#horarios').value = accion.horarios;
                document.querySelector('#tipoAccion').value = accion.tipo;
                document.querySelector('#descripcion').value = accion.descripcion;
                document.querySelector('#web').value = accion.web;
                
                // Casillas de verificación
                document.querySelectorAll('input[name="responsableAccion"]').forEach(cb => {
                    cb.checked = accion.responsables.includes(cb.value);
                });
                
                currentEditingId = actionId;
                actionForm.classList.add('show');
                document.querySelector('.main-content').classList.add('form-open');
                document.querySelector('#form-title').textContent = 'Editar Acción';
                
            } catch (error) {
                console.error('Error al obtener acción:', error);
            }
        }
        
        // Eliminación con modal
        if (e.target.classList.contains('delete-icon')) {
            rowToDelete = row;
            actionIdToDelete = actionId;
            deleteModal.style.display = 'flex';
        }
    });

    // Confirmar la eliminación
    confirmDeleteBtn.addEventListener('click', async () => {
        try {
            const response = await fetch(`/acciones/${actionIdToDelete}`, { method: 'DELETE' });
            const result = await response.json();
            if (result.success) {
                showToast('✅ Acción eliminada correctamente', 'success');
                // Recargar la tabla con los filtros actuales
                setTimeout(() => aplicarFiltros(), 500);
            } else {
                showToast('❌ No se pudo eliminar la acción', 'error');
            }
        } catch (error) {
            console.error('Error al eliminar:', error);
            showToast('❌ Error al eliminar la acción', 'error');
        }
        deleteModal.style.display = 'none';
        rowToDelete = null;
        actionIdToDelete = null;
    });

    // Cancelar la eliminación
    cancelDeleteBtn.addEventListener('click', () => {
        deleteModal.style.display = 'none';
        rowToDelete = null;
        actionIdToDelete = null;
    });

    // Event listeners para los filtros
    document.getElementById('aplicar-filtros').addEventListener('click', aplicarFiltros);
    document.getElementById('limpiar-filtros').addEventListener('click', limpiarFiltros);
    
    // Aplicar filtros automáticamente al cambiar el orden
    document.getElementById('ordenar-por').addEventListener('change', aplicarFiltros);
    
    // Aplicar filtros automáticamente al escribir en el campo de búsqueda
    document.getElementById('buscar-nombre').addEventListener('input', 
        debounce(aplicarFiltros, 300)
    );
    
    // Función debounce para evitar demasiadas llamadas
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Cargar datos iniciales con el filtro por defecto
    aplicarFiltros();

    // Gestión del modal de cambio de contraseña
    const changePasswordBtn = document.getElementById('change-password-btn');
    const passwordModal = document.getElementById('password-modal');
    const passwordForm = document.getElementById('password-form');
    const cancelPasswordBtn = document.getElementById('cancel-password');
    const passwordMessage = document.getElementById('password-message');

    // Mostrar modal de cambio de contraseña
    changePasswordBtn.addEventListener('click', () => {
        passwordModal.style.display = 'flex';
        passwordForm.reset();
        passwordMessage.style.display = 'none';
    });

    // Cerrar modal de cambio de contraseña
    cancelPasswordBtn.addEventListener('click', () => {
        passwordModal.style.display = 'none';
        passwordForm.reset();
        passwordMessage.style.display = 'none';
    });

    // Cerrar modal al hacer clic fuera
    passwordModal.addEventListener('click', (e) => {
        if (e.target === passwordModal) {
            passwordModal.style.display = 'none';
            passwordForm.reset();
            passwordMessage.style.display = 'none';
        }
    });

    // Manejar el envío del formulario de cambio de contraseña
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        // Validación del lado del cliente
        if (newPassword !== confirmPassword) {
            showPasswordMessage('Las contraseñas nuevas no coinciden', 'error');
            return;
        }

        // if (newPassword.length < 6) {
        //     showPasswordMessage('La nueva contraseña debe tener al menos 6 caracteres', 'error');
        //     return;
        // }

        try {
            const response = await fetch('/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                    confirmPassword
                })
            });

            const result = await response.json();

            if (response.ok) {
                showPasswordMessage(result.message, 'success');
                passwordForm.reset();
                showToast('✅ Contraseña cambiada correctamente', 'success');
                
                // Cerrar modal después de 2 segundos
                setTimeout(() => {
                    passwordModal.style.display = 'none';
                    passwordMessage.style.display = 'none';
                }, 2000);
            } else {
                showPasswordMessage(result.error, 'error');
            }
        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            showPasswordMessage('Error del servidor', 'error');
        }
    });

    // Función para mostrar mensajes en el modal de contraseña
    function showPasswordMessage(message, type) {
        passwordMessage.textContent = message;
        passwordMessage.className = `message ${type}`;
        passwordMessage.style.display = 'block';
    }
});