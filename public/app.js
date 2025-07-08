document.addEventListener('DOMContentLoaded', function() {
    const newActionButton = document.getElementById('new-action-btn');
    const actionForm = document.getElementById('action-form');
    const cancelFormBtn = document.getElementById('cancel-form');
    const loginContainer = document.getElementById('login-container');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');

    // Mostrar formulario de nueva acción
    if (newActionButton && actionForm) {
        newActionButton.addEventListener('click', function() {
            actionForm.style.display = 'block';
            window.scrollTo({
                top: actionForm.offsetTop - 20,
                behavior: 'smooth'
            });
        });
    }

    // Ocultar formulario
    if (cancelFormBtn && actionForm) {
        cancelFormBtn.addEventListener('click', function() {
            actionForm.style.display = 'none';
        });
    }

    // Simular inicio de sesión
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            if (email === 'admin@kudehezi.org' && password === 'password123') {
                loginContainer.style.display = 'none';
            } else {
                loginError.style.display = 'block';
            }
        });
    }

    // Gescion borrador d'accions
    document.querySelectorAll('.action-icon[title="Editar"]').forEach(function(editBtn) {
        editBtn.addEventListener('click', function() {
            
            const row = editBtn.closest('tr');
            
            document.querySelector('#nombre').value = row.children[0].innerText;
            document.querySelector('#asociacionEntidad').value = row.children[1].innerText;
            document.querySelector('#fecha').value = row.children[2].innerText;
            document.querySelector('#descripcion').value = row.children[3].innerText;
            

            // mostrar el formulario de edición
            const actionForm = document.querySelector('#action-form');
            actionForm.style.display = 'block';
            document.querySelector('#form-title').innerText = 'Editar Acción';
        });
    });

    document.querySelectorAll('.action-icon[title="Eliminar"]').forEach(function(deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            if (confirm('¿Seguro que quieres eliminar esta acción?')) {
                // borrar le fila de la tabla
                const row = deleteBtn.closest('tr');
                row.remove();
                // Aquí también puedes enviar una solicitud AJAX al servidor para eliminar en la base de datos
            }
        });
    });
});