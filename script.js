// VARIABLES GLOBALES (Para que todas las funciones puedan acceder a ellas)
let cart = cargarCarrito();

document.addEventListener('DOMContentLoaded', () => {
    actualizarInterfazCarrito();
    inicializarPaginaDePago();

    // 1. ELEMENTOS DE NAVEGACIÓN
    const links = {
        inicio: document.getElementById('link-inicio'),
        skincare: document.getElementById('link-skincare'),
        makeup: document.getElementById('link-makeup'),
        nosotros: document.getElementById('link-nosotros'),
        heroBtn: document.getElementById('hero-link-skincare')
    };

    // 2. SECCIONES
    const sections = {
        hero: document.getElementById('inicio'),
        makeup: document.getElementById('seccion-makeup'),
        skincare: document.getElementById('seccion-skincare'),
        nosotros: document.getElementById('seccion-nosotros')
    };

    // 3. FUNCIÓN PARA CAMBIAR SECCIÓN
    function mostrarSeccion(seccionAMostrar) {
        Object.values(sections).forEach(sec => {
            if (sec) sec.style.display = 'none';
        });

        if (seccionAMostrar) {
            seccionAMostrar.style.display = (seccionAMostrar === sections.hero) ? 'block' : 'flex';
            window.scrollTo(0, 0);
        }

        if (seccionAMostrar === sections.makeup) {
            applyFilter('cara');
        }
    }

    // 4. ASIGNACIÓN DE CLICS NAVEGACIÓN
    if(links.inicio) links.inicio.onclick = (e) => { e.preventDefault(); mostrarSeccion(sections.hero); };
    if(links.skincare) links.skincare.onclick = (e) => { e.preventDefault(); mostrarSeccion(sections.skincare); };
    if(links.makeup) links.makeup.onclick = (e) => { e.preventDefault(); mostrarSeccion(sections.makeup); };
    if(links.nosotros) links.nosotros.onclick = (e) => { e.preventDefault(); mostrarSeccion(sections.nosotros); };
    
    if (links.heroBtn) {
        links.heroBtn.onclick = (e) => { e.preventDefault(); mostrarSeccion(sections.skincare); };
    }

    // 5. LÓGICA DE FILTROS (Makeup)
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

    // 6. EVENTOS DE CLIC (Tonos y Carrito)
    document.addEventListener('click', (e) => {
        // Seleccionar tono
        if (e.target.classList.contains('tone-circle')) {
            const parent = e.target.parentElement;
            parent.querySelectorAll('.tone-circle').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
        }

        // AÑADIR AL CARRITO (LÓGICA ACTUALIZADA)
        if (e.target.classList.contains('add-to-cart')) {
            const btn = e.target;
            const productCard = btn.closest('.product-card');
            const toneSelector = productCard.querySelector('.tone-selector');
            const activeTone = toneSelector ? toneSelector.querySelector('.tone-circle.active') : null;
            
            // Validar tono si existe selector
            if (toneSelector && !activeTone) {
                alert("Por favor, selecciona un tono");
                return;
            }

            // Capturar datos del producto
            const productoInfo = {
                nombre: productCard.querySelector('h4').innerText,
                // Limpiamos el precio para que sea un número (quita $, puntos, etc)
                precio: parseInt(productCard.querySelector('.price').innerText.replace(/[^0-9]/g, '')),
                imagen: productCard.querySelector('img').src,
                tono: activeTone ? activeTone.title || "Seleccionado" : 'Único'
            };

            // Agregar al array global
            cart.push(productoInfo);
            guardarCarrito();
            
            // Actualizar visualmente el carrito lateral y el contador del header
            actualizarInterfazCarrito();
            mostrarNotificacion(productoInfo.nombre);

            // Feedback visual en el botón
            const originalText = btn.innerText;
            btn.innerText = "¡AGREGADO!";
            btn.classList.add('btn-gold'); // Usamos tu clase de CSS
            
            setTimeout(() => {
                btn.innerText = originalText;
                btn.classList.remove('btn-gold');
            }, 1500);
        }
    });
});

// --- FUNCIONES GLOBALES (FUERA DEL DOMCONTENTLOADED) ---

function actualizarInterfazCarrito() {
    const container = document.getElementById('cart-items-container');
    const totalDisplay = document.getElementById('cart-total-amount');
    const cartCountDisplay = document.getElementById('cart-count');

    if (cartCountDisplay) {
        cartCountDisplay.innerText = cart.length;
    }

    if (!container || !totalDisplay) return;

    container.innerHTML = "";
    let total = 0;

    if (cart.length === 0) {
        container.innerHTML = '<p class="empty-msg">Tu carrito está vacío.</p>';
        totalDisplay.innerText = "$0";
        return;
    }

    cart.forEach((item, index) => {
        total += item.precio;
        
        const cartItem = document.createElement('div');
        cartItem.innerHTML = `
            <div style="display: flex; gap: 15px; margin-bottom: 20px; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                <img src="${item.imagen}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
                <div style="flex: 1;">
                    <h4 style="font-size: 14px; margin: 0; color: #333;">${item.nombre}</h4>
                    <p style="font-size: 12px; color: #95789b; margin: 4px 0;">Tono: ${item.tono}</p>
                    <span style="font-weight: bold; color: #d4af37;">$${item.precio.toLocaleString()}</span>
                </div>
                <button onclick="eliminarDelCarrito(${index})" style="background: none; border: none; color: #ff4d4d; cursor: pointer; font-size: 20px;">&times;</button>
            </div>
        `;
        container.appendChild(cartItem);
    });

    totalDisplay.innerText = `$${total.toLocaleString()}`;
}

function eliminarDelCarrito(index) {
    cart.splice(index, 1);
    guardarCarrito();
    actualizarInterfazCarrito();
}

function toggleCart() {
    const sideCart = document.getElementById('side-cart');
    const overlay = document.getElementById('cart-overlay');
    
    if (!sideCart || !overlay) return;

    sideCart.classList.toggle('open');
    
    if (sideCart.classList.contains('open')) {
        overlay.style.display = 'block';
        document.body.style.overflow = 'hidden'; 
    } else {
        overlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function goToPayment() {
    if (cart.length === 0) {
        alert("El carrito está vacío");
        return;
    }
    guardarCarrito();
    window.location.href = "payment.html";
}

function cargarCarrito() {
    try {
        const cartGuardado = localStorage.getItem('hazeCart');
        return cartGuardado ? JSON.parse(cartGuardado) : [];
    } catch (error) {
        console.error("No se pudo cargar el carrito:", error);
        return [];
    }
}

function guardarCarrito() {
    localStorage.setItem('hazeCart', JSON.stringify(cart));
}

function calcularTotal() {
    return cart.reduce((acc, item) => acc + item.precio, 0);
}

function inicializarPaginaDePago() {
    const checkoutPage = document.getElementById('checkout-page');
    if (!checkoutPage) return;

    const resumenContainer = document.getElementById('checkout-items');
    const subtotal = document.getElementById('checkout-subtotal');
    const total = document.getElementById('checkout-total');
    const form = document.getElementById('checkout-form');
    const feedback = document.getElementById('checkout-feedback');
    const volverBtn = document.getElementById('back-to-store');

    if (volverBtn) {
        volverBtn.addEventListener('click', () => {
            window.location.href = "index.html";
        });
    }

    if (cart.length === 0) {
        if (resumenContainer) {
            resumenContainer.innerHTML = `
                <div class="checkout-empty">
                    <h3>No hay productos para pagar</h3>
                    <p>Agregá artículos al carrito para simular una compra.</p>
                </div>
            `;
        }

        if (subtotal) subtotal.innerText = "$0";
        if (total) total.innerText = "$0";
        if (form) form.style.display = 'none';
        return;
    }

    const totalCompra = calcularTotal();

    if (resumenContainer) {
        resumenContainer.innerHTML = "";

        cart.forEach(item => {
            const itemElement = document.createElement('article');
            itemElement.className = 'checkout-item';
            itemElement.innerHTML = `
                <img src="${item.imagen}" alt="${item.nombre}">
                <div>
                    <h4>${item.nombre}</h4>
                    <p>Tono: ${item.tono}</p>
                    <span>$${item.precio.toLocaleString()}</span>
                </div>
            `;
            resumenContainer.appendChild(itemElement);
        });
    }

    if (subtotal) subtotal.innerText = `$${totalCompra.toLocaleString()}`;
    if (total) total.innerText = `$${totalCompra.toLocaleString()}`;

    if (form) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();

            const nombre = document.getElementById('checkout-name').value.trim();
            const email = document.getElementById('checkout-email').value.trim();

            cart = [];
            guardarCarrito();

            if (feedback) {
                feedback.innerHTML = `
                    <div class="checkout-success">
                        <h3>Compra simulada con éxito</h3>
                        <p>Gracias, ${nombre}. Enviamos la confirmación de prueba a ${email}.</p>
                        <p>Tu pedido fue registrado como una demo y no se realizó ningún cobro real.</p>
                    </div>
                `;
            }

            if (resumenContainer) {
                resumenContainer.innerHTML = `
                    <div class="checkout-empty">
                        <h3>Pedido finalizado</h3>
                        <p>Ya podés volver a la tienda y empezar una nueva compra.</p>
                    </div>
                `;
            }

            if (subtotal) subtotal.innerText = "$0";
            if (total) total.innerText = "$0";
            form.reset();
            form.style.display = 'none';
        });
    }
}

function mostrarNotificacion(nombreProducto) {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.classList.add('toast-notification');
    
    toast.innerHTML = `
        <span>✨</span>
        <div>
            <strong style="display:block; font-size: 12px; color: #95789b;">HAZE BEAUTY</strong>
            <span style="font-size: 14px;">${nombreProducto} añadido</span>
        </div>
    `;
    
    container.appendChild(toast);
    
    // Eliminar del DOM después de que termine la animación
    setTimeout(() => {
        toast.remove();
    }, 3500);
}
