// LÓGICA DE FILTROS PARA EL CATÁLOGO
document.addEventListener('DOMContentLoaded', () => {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const products = document.querySelectorAll('.product-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const filter = button.getAttribute('data-filter');

            // Cambiar estilo de botón activo (opcional)
            filterButtons.forEach(btn => btn.style.color = "#555");
            button.style.color = "#d4af37";

            products.forEach(product => {
                if (filter === 'all') {
                    product.style.display = 'block'; // Muestra todo
                } else if (product.classList.contains(filter)) {
                    product.style.display = 'block'; // Muestra si coincide
                } else {
                    product.style.display = 'none';  // Esconde si no coincide
                }
            });
        });
    });
});
// Selección de tonos de base
document.querySelectorAll('.tone-circle').forEach(circle => {
    circle.addEventListener('click', function() {
        // Quita la clase activa de los otros círculos del mismo producto
        this.parentElement.querySelectorAll('.tone-circle').forEach(c => c.classList.remove('active'));
        // Agrega la clase al que tocaste
        this.classList.add('active');
    });
});

// Simulación de Carrito
document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', function() {
        const productName = this.parentElement.querySelector('h4').innerText;
        alert(`¡${productName} ha sido añadido a tu carrito de HAZE Beauty!`);
    });
});