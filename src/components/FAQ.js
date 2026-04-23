import React from 'react';
import Link from 'next/link';

const FAQ = () => {
  return (
    <div className="faq-page">
      <header className="main-header faq-header">
        <div className="logo-container">
          <Link to="/">
            <img src="LOGO-removebg-preview.png" alt="HAZE Beauty Logo" className="haze-logo" />
          </Link>
        </div>

        <nav className="nav-menu">
          <ul>
            <li><Link href="/">Volver a la tienda</Link></li>
            <li><a href="#faq-list">FAQ</a></li>
            <li><a href="#reviews">Reseñas</a></li>
          </ul>
        </nav>
      </header>

      <main className="faq-main">
        <section className="faq-hero">
          <div className="faq-hero-copy">
            <span className="news-tag">Preguntas Frecuentes</span>
            <h1>Todo lo que necesitás saber antes de comprar en <span className="gold-text">HAZE</span></h1>
            <p>Respondimos las dudas más comunes sobre envíos, pagos, tonos, rutinas de skincare y pruebas de producto para que tu experiencia sea simple, segura y linda de recorrer.</p>
            <a href="#faq-list" className="skincare-link faq-link">Ver respuestas →</a>
          </div>

          <div className="faq-hero-visual">
            <div className="faq-floating-card">
              <img src="/toner-haze.png" alt="Hydrating Toner HAZE" />
            </div>
            <div className="faq-floating-card alt">
              <img src="/paleta-sombras.png" alt="Ultimate Glow Palette HAZE" />
            </div>
          </div>
        </section>

        <section className="faq-feature-strip">
          <article>
            <strong>Envíos a todo el país</strong>
            <p>Despachos de 2 a 6 días hábiles según la zona.</p>
          </article>
          <article>
            <strong>Pago seguro</strong>
            <p>Tarjeta, débito o transferencia en el checkout demo.</p>
          </article>
          <article>
            <strong>Rutinas guiadas</strong>
            <p>Te ayudamos a combinar fórmulas según tu piel.</p>
          </article>
        </section>

        <section id="faq-list" className="faq-content">
          <div className="faq-column">
            <h2>Dudas más consultadas</h2>

            <details className="faq-item" open>
              <summary>¿Cuánto tarda en llegar mi pedido?</summary>
              <p>Los envíos suelen demorar entre 2 y 6 días hábiles. Cuando tu compra se despacha, recibís un correo con el seguimiento.</p>
            </details>

            <details className="faq-item">
              <summary>¿Cómo sé qué producto de skincare elegir?</summary>
              <p>Si buscás hidratación ligera, empezá por el <strong>Hydrating Toner</strong>. Para limpieza suave, el <strong>Gentle Cleanser</strong>. Si querés sellar nutrición y glow, sumá la <strong>Daily Moisturizer</strong>.</p>
            </details>

            <details className="faq-item">
              <summary>¿Los productos son aptos para piel sensible?</summary>
              <p>Sí, las fórmulas están pensadas para ser suaves y minimalistas. Si tu piel es muy reactiva, te recomendamos probar primero en una pequeña zona.</p>
            </details>

            <details className="faq-item">
              <summary>¿Puedo comprar makeup y skincare en el mismo pedido?</summary>
              <p>Sí. Podés combinar productos de ambas categorías en un mismo carrito y finalizar todo junto.</p>
            </details>

            <details className="faq-item">
              <summary>¿Aceptan cambios o devoluciones?</summary>
              <p>Sí, si el producto llega con un problema o hubo un error en el envío. Solo necesitás escribirnos dentro de las 48 horas posteriores a la entrega.</p>
            </details>

            <details className="faq-item">
              <summary>¿La compra del sitio es real?</summary>
              <p>La pantalla de pago actual está pensada para simular una compra. Sirve para mostrar el flujo completo sin procesar cobros reales.</p>
            </details>
          </div>

          <aside className="faq-column faq-side-panel">
            <h3>Favoritos del momento</h3>

            <article className="faq-product-callout">
              <img src="/toner-haze.png" alt="Hydrating Toner HAZE" />
              <div>
                <h4>Hydrating Toner</h4>
                <p>Un paso esencial para hidratar, refrescar y preparar la piel antes del serum, la crema o el makeup.</p>
              </div>
            </article>

            <article className="faq-product-callout">
              <img src="/foundation-haze.png" alt="Pro Filt'r Foundation HAZE" />
              <div>
                <h4>Pro Filt'r Foundation</h4>
                <p>Acabado soft matte, ideal para una base prolija que dura todo el día.</p>
              </div>
            </article>

            <div className="faq-note">
              <h4>Tip HAZE</h4>
              <p>Aplicá el toner con la piel apenas húmeda y sellá enseguida con la crema para potenciar la hidratación.</p>
            </div>
          </aside>
        </section>

        <section id="reviews" className="faq-reviews">
          <div className="faq-section-head">
            <span className="news-tag">Reseñas</span>
            <h2>Lo que dice la comunidad</h2>
          </div>

          <div className="faq-review-grid">
            <article className="faq-review-card">
              <div className="faq-review-product">
                <img src="/foundation-haze.png" alt="Pro Filt'r Foundation" />
                <div>
                  <h4>Pro Filt'r Foundation</h4>
                  <span>★★★★★</span>
                </div>
              </div>
              <p>"La base queda súper prolija, liviana y pareja. Tiene ese acabado soft matte que hace que el makeup se vea elegante todo el día."</p>
              <strong>Martina, Córdoba</strong>
            </article>

            <article className="faq-review-card">
              <div className="faq-review-product">
                <img src="/paleta-sombras.png" alt="Ultimate Glow Palette" />
                <div>
                  <h4>Ultimate Glow Palette</h4>
                  <span>★★★★★</span>
                </div>
              </div>
              <p>"Los tonos pigmentan hermoso y se difuminan fácil. La uso tanto para looks suaves como para algo más nocturno."</p>
              <strong>Julieta, Rosario</strong>
            </article>

            <article className="faq-review-card">
              <div className="faq-review-product">
                <img src="/labiales.png" alt="Iconic Matte Lipstick" />
                <div>
                  <h4>Iconic Matte Lipstick</h4>
                  <span>★★★★☆</span>
                </div>
              </div>
              <p>"El color queda intenso desde la primera pasada y el acabado aterciopelado se siente muy cómodo. Se nota premium."</p>
              <strong>Camila, Buenos Aires</strong>
            </article>
          </div>
        </section>
      </main>

      <footer className="main-footer faq-footer">
        <div className="footer-container">
          <div className="footer-section brand">
          <img src="/LOGO-removebg-preview.png" alt="HAZE Logo" className="footer-logo" />
          </div>

          <div className="footer-section links">
            <h4>Navegación</h4>
            <ul>
                <li><Link href="/">Inicio</Link></li>
                <li><Link href="/">Tienda</Link></li>
            </ul>
          </div>

          <div className="footer-section newsletter">
            <h4>¿Seguimos en contacto?</h4>
            <p>Dejanos tu email para recibir novedades, lanzamientos y tips de rutina.</p>
            <form className="footer-form">
              <input type="email" placeholder="Tu email aquí..." required />
              <button type="submit">Suscribirme</button>
            </form>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 HAZE Beauty. Todos los derechos reservados.</p>
          <div className="social-icons">
            <span>Instagram</span> | <span>TikTok</span> | <span>Facebook</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default FAQ;