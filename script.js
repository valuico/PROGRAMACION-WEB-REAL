document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DE NAVEGACIÓN ---
    const linkInicio = document.getElementById('link-inicio');
    const linkSkincare = document.getElementById('link-skincare');
    const linkMakeup = document.getElementById('link-makeup');

    const sectionHero = document.getElementById('inicio');
    const sectionMakeup = document.getElementById('seccion-makeup');
    const sectionSkincare = document.getElementById('seccion-skincare');

    // --- ELEMENTOS DE CARRITO Y FILTROS ---
    const filterButtons = document.querySelectorAll('.filter-btn');
    const products = document.querySelectorAll('#seccion-makeup .product-card');
    const cartDisplay = document.getElementById('cart-count');
    let cartCounter = 0;
    const links = {
    inicio: document.getElementById('link-inicio'),
    skincare: document.getElementById('link-skincare'),
    makeup: document.getElementById('link-makeup'),
    nosotros: document.getElementById('link-nosotros') // <--- NUEVO
    };

    // --- FUNCIÓN NAVEGACIÓN PRINCIPAL ---
    function mostrarSeccion(seccionAMostrar) {
        sectionHero.style.display = 'none';
        sectionMakeup.style.display = 'none';
        sectionSkincare.style.display = 'none';

        seccionAMostrar.style.display = 'flex';
        window.scrollTo(0, 0);

        // Si entramos a Makeup, aplicamos filtro inicial "cara"
        if (seccionAMostrar === sectionMakeup) {
            applyFilter('cara');
        }
        const sections = {
        hero: document.getElementById('inicio'),
        makeup: document.getElementById('seccion-makeup'),
        skincare: document.getElementById('seccion-skincare'),
        nosotros: document.getElementById('seccion-nosotros') // <--- NUEVO
        };
    }

    linkInicio.onclick = (e) => { e.preventDefault(); mostrarSeccion(sectionHero); };
    linkSkincare.onclick = (e) => { e.preventDefault(); mostrarSeccion(sectionSkincare); };
    linkMakeup.onclick = (e) => { e.preventDefault(); mostrarSeccion(sectionMakeup); };
    links.nosotros.onclick = (e) => { e.preventDefault(); mostrarSeccion(sections.nosotros); }; // <--- NUEVO

    // --- LÓGICA DE FILTROS (Solo para Makeup) ---
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
            applyFilter(filter);
        });
    });

    // --- SELECCIÓN DE TONOS Y CARRITO ---
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('tone-circle')) {
            const parent = e.target.parentElement;
            parent.querySelectorAll('.tone-circle').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
        }
    });

    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function() {
            const productCard = this.closest('.product-card');
            const toneSelector = productCard.querySelector('.tone-selector');
            
            if (toneSelector && !toneSelector.querySelector('.tone-circle.active')) {
                alert("Por favor, selecciona un tono");
                return;
            }

            cartCounter++;
            cartDisplay.innerText = cartCounter;
            this.innerText = "¡AGREGADO!";
            setTimeout(() => this.innerText = "Añadir al Carrito", 1500);
        });
    });
    // Buscamos el botón del banner
    const btnHero = document.getElementById('hero-link-skincare');

    // Buscamos las secciones (asegúrate que estos nombres coincidan con tus IDs de HTML)
    const seccionInicio = document.getElementById('inicio');
    const seccionSkincare = document.getElementById('seccion-skincare');

    if (btnHero) {
        btnHero.onclick = function(e) {
            e.preventDefault(); // Evita que la página solo recargue
            
            // 1. Ocultamos el inicio
            seccionInicio.style.display = 'none';
            
            // 2. Mostramos skincare
            seccionSkincare.style.display = 'flex';
            
            // 3. Subimos al principio de la página
            window.scrollTo(0, 0);
            
            console.log("Navegando a Skincare desde el Hero");
        };
    }
});