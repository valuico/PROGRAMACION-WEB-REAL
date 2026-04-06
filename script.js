document.addEventListener('DOMContentLoaded', () => {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const products = document.querySelectorAll('.product-card');
    const cartDisplay = document.getElementById('cart-count');
    let cartCounter = 0;

    // --- 1. LÓGICA DE FILTROS ---
    const applyFilter = (filter) => {
        products.forEach(product => {
            if (filter === 'all' || product.classList.contains(filter)) {
                product.style.display = 'flex'; // Usamos flex para que Grid lo reconozca
                setTimeout(() => product.classList.add('show'), 10);
            } else {
                product.classList.remove('show');
                product.style.display = 'none'; // Desaparece del flujo, eliminando huecos
            }
        });
    };

    // Filtro inicial
    applyFilter('cara');

    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const filter = button.getAttribute('data-filter');
            filterButtons.forEach(btn => btn.style.color = "#555");
            button.style.color = "#d4af37";
            applyFilter(filter);
        });
    });

    // --- 2. SELECCIÓN DE TONOS ---
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('tone-circle')) {
            const parent = e.target.parentElement;
            parent.classList.remove('error');
            parent.querySelectorAll('.tone-circle').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
        }
    });

    // --- 3. VALIDACIÓN Y CARRITO ---
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function() {
            const productCard = this.closest('.product-card');
            const productName = productCard.querySelector('h4').innerText;
            const toneSelector = productCard.querySelector('.tone-selector');
            
            // Validación de tonos
            if (toneSelector) {
                const selectedTone = toneSelector.querySelector('.tone-circle.active');
                if (!selectedTone) {
                    toneSelector.classList.add('error');
                    alert(`Por favor, selecciona un tono para ${productName}`);
                    setTimeout(() => toneSelector.classList.remove('error'), 2000);
                    return;
                }
            }

            // Éxito al agregar
            cartCounter++;
            cartDisplay.innerText = cartCounter;
            
            const originalText = this.innerText;
            this.innerText = "¡AGREGADO!";
            const originalColor = this.style.backgroundColor;
            this.style.backgroundColor = "#28a745";
            
            setTimeout(() => {
                this.innerText = originalText;
                this.style.backgroundColor = originalColor;
            }, 1500);
        });
    });
});