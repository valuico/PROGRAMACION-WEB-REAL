import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="main-footer">
      <div className="footer-container">
        <div className="footer-section brand">
          <img src="/LOGO-removebg-preview.png" alt="HAZE Logo" className="footer-logo" />
          <p>Realzando tu brillo natural con productos de alta gama y crueldad cero.</p>
        </div>

        <div className="footer-section links">
          <h4>Navegación</h4>
          <ul>
            <li><a href="#" data-section-target="hero">Inicio</a></li>
            <li><a href="#" data-section-target="makeup">Makeup</a></li>
            <li><a href="#" data-section-target="skincare">Skincare</a></li>
          </ul>
        </div>

        <div className="footer-section newsletter">
          <h4>¡Unite a la comunidad!</h4>
          <p>Recibí ofertas exclusivas y lanzamientos antes que nadie.</p>
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
  );
};

export default Footer;