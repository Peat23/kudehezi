document.addEventListener('DOMContentLoaded', function() {
    // Elements DOM
    const newActionButton = document.querySelector('#new-action-btn');
    const actionForm = document.querySelector('#action-form');
    const cancelFormBtn = document.querySelector('#cancel-form');
    const accionForm = document.querySelector('#accion-form');
    const actionsBody = document.querySelector('#actions-body');
    
    
    // Variables d'état
    let currentEditingId = null;

    // Afficher le formulaire
    newActionButton.addEventListener('click', () => {
        actionForm.style.display = 'block';
        currentEditingId = null;
        window.scrollTo(0, 530);
        accionForm.reset();
        document.querySelector('#form-title').textContent = 'Nueva Acción';
    });

    // Cacher le formulaire
    cancelFormBtn.addEventListener('click', () => {
        actionForm.style.display = 'none';
    });

    // Soumission du formulaire
    accionForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Récupération des données
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
                // Mise à jour
                const response = await fetch(`/acciones/${currentEditingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                const result = await response.json();
                if (result.success) location.reload();
            } else {
                // Création
                const response = await fetch('/acciones', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                const result = await response.json();
                if (result.id) location.reload();
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al guardar la acción');
        }
    });

    // Modal de suppression
    const deleteModal = document.getElementById('delete-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    let rowToDelete = null;
    let actionIdToDelete = null;

    // Écouteurs pour les actions
    actionsBody.addEventListener('click', async (e) => {
        const row = e.target.closest('tr');
        if (!row) return;

        const actionId = row.dataset.id;
        
        // Édition
        if (e.target.classList.contains('edit-icon')) {
            try {
                const response = await fetch(`/acciones/${actionId}`);
                const accion = await response.json();
                
                // Remplir le formulaire
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
                
                // Cases à cocher
                document.querySelectorAll('input[name="responsableAccion"]').forEach(cb => {
                    cb.checked = accion.responsables.includes(cb.value);
                });
                
                currentEditingId = actionId;
                actionForm.style.display = 'block';
                document.querySelector('#form-title').textContent = 'Editar Acción';
                
            } catch (error) {
                console.error('Error al obtener acción:', error);
            }
        }
        
        // Suppression avec modal
        if (e.target.classList.contains('delete-icon')) {
            rowToDelete = row;
            actionIdToDelete = actionId;
            deleteModal.style.display = 'flex';
        }
    });

    // Confirmer la suppression
    confirmDeleteBtn.addEventListener('click', async () => {
        try {
            const response = await fetch(`/acciones/${actionIdToDelete}`, { method: 'DELETE' });
            const result = await response.json();
            if (result.success) {
                rowToDelete.remove();
                alert('Acción eliminada correctamente.');
            } else {
                alert('No se pudo eliminar la acción.');
            }
        } catch (error) {
            console.error('Error al eliminar:', error);
            alert('Error al eliminar la acción');
        }
        deleteModal.style.display = 'none';
        rowToDelete = null;
        actionIdToDelete = null;
    });

    // Annuler la suppression
    cancelDeleteBtn.addEventListener('click', () => {
        deleteModal.style.display = 'none';
        rowToDelete = null;
        actionIdToDelete = null;
    });
});