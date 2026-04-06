document.addEventListener('DOMContentLoaded', () => {
    // 1. ELEMENTOS DE NAVEGACIÓN (Botones)
    const links = {
        inicio: document.getElementById('link-inicio'),
        skincare: document.getElementById('link-skincare'),
        makeup: document.getElementById('link-makeup'),
        nosotros: document.getElementById('link-nosotros'),
        heroBtn: document.getElementById('hero-link-skincare') // El botón del banner
    };

    // 2. SECCIONES (Contenedores)
    const sections = {
        hero: document.getElementById('inicio'),
        makeup: document.getElementById('seccion-makeup'),
        skincare: document.getElementById('seccion-skincare'),
        nosotros: document.getElementById('seccion-nosotros')
    };

    // 3. FUNCIÓN MAESTRA PARA CAMBIAR SECCIÓN
    function mostrarSeccion(seccionAMostrar) {
        // Ocultamos todas las secciones
        Object.values(sections).forEach(sec => {
            if (sec) sec.style.display = 'none';
        });

        // Mostramos la que corresponde
        if (seccionAMostrar) {
            seccionAMostrar.style.display = (seccionAMostrar === sections.hero) ? 'block' : 'flex';
            window.scrollTo(0, 0);
        }

        // Si entramos a Makeup, aplicamos filtro inicial "cara"
        if (seccionAMostrar === sections.makeup) {
            applyFilter('cara');
        }
    }

    // 4. ASIGNACIÓN DE CLICS
    links.inicio.onclick = (e) => { e.preventDefault(); mostrarSeccion(sections.hero); };
    links.skincare.onclick = (e) => { e.preventDefault(); mostrarSeccion(sections.skincare); };
    links.makeup.onclick = (e) => { e.preventDefault(); mostrarSeccion(sections.makeup); };
    links.nosotros.onclick = (e) => { e.preventDefault(); mostrarSeccion(sections.nosotros); };
    
    // Botón del Banner (Hero)
    if (links.heroBtn) {
        links.heroBtn.onclick = (e) => { e.preventDefault(); mostrarSeccion(sections.skincare); };
    }

    // 5. LÓGICA DE FILTROS (Solo Makeup)
    const filterButtons = document.querySelectorAll('.filter-btn');
    const products = document.querySelectorAll('#seccion-makeup .product-card');

    function applyFilter(filter) {
        products.forEach(product => {
            if (filter === 'all' || product.classList.contains(filter)) {
                product.style.display = 'flex';
                setTimeout(() => product.classList.add('show'), 10);
            } else {
                product.classList.remove('show');
                product.style.display = 'none';
            }
        });
    }

    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const filter = button.getAttribute('data-filter');
            filterButtons.forEach(btn => btn.style.color = "#555");
            button.style.color = "#d4af37";
            applyFilter(filter);
        });
    });

    // 6. CARRITO Y SELECCIÓN DE TONOS
    const cartDisplay = document.getElementById('cart-count');
    let cartCounter = 0;

    document.addEventListener('click', (e) => {
        // Seleccionar tono
        if (e.target.classList.contains('tone-circle')) {
            const parent = e.target.parentElement;
            parent.querySelectorAll('.tone-circle').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
        }

        // Añadir al carrito
        if (e.target.classList.contains('add-to-cart')) {
            const btn = e.target;
            const productCard = btn.closest('.product-card');
            const toneSelector = productCard.querySelector('.tone-selector');
            
            if (toneSelector && !toneSelector.querySelector('.tone-circle.active')) {
                alert("Por favor, selecciona un tono");
                return;
            }

            cartCounter++;
            cartDisplay.innerText = cartCounter;
            const originalText = btn.innerText;
            btn.innerText = "¡AGREGADO!";
            setTimeout(() => btn.innerText = originalText, 1500);
        }
    });
});