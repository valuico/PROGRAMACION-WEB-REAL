'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function PaymentPage() {
  const [cart, setCart] = useState([]);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('hazeCart');
    if (saved) setCart(JSON.parse(saved));
  }, []);

  const totalPrice = cart.reduce((sum, item) => sum + item.precio, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    localStorage.setItem('hazeCart', JSON.stringify([]));
    setCart([]);
  };

  return (
    <div className="checkout-page">
      <div className="checkout-layout">
        <div className="checkout-panel">
          <div className="checkout-eyebrow">PASO FINAL</div>
          <h1>Resumen de tu Compra</h1>
          <p className="checkout-intro">Revisa los items en tu carrito antes de confirmar.</p>

          <div className="checkout-items">
            {cart.length === 0 && !submitted ? (
              <div className="checkout-empty">
                <h3>No hay productos para pagar</h3>
                <p>Agregá artículos al carrito para simular una compra.</p>
              </div>
            ) : null}
            
            {cart.map(item => (
              <article key={item.id} className="checkout-item">
                <Image src={item.img} alt={item.nombre} width={78} height={78} />
                <div>
                  <h4>{item.nombre}</h4>
                  <p>Tono: {item.selectedTone}</p>
                  <span>${item.precio.toLocaleString()}</span>
                </div>
              </article>
            ))}
          </div>

          {!submitted && (
            <>
              <div className="checkout-totals">
                <div>
                  <span>Subtotal</span>
                  <strong>${totalPrice.toLocaleString()}</strong>
                </div>
                <div>
                  <span>Envío</span>
                  <strong>Gratis</strong>
                </div>
                <div>
                  <span>Total</span>
                  <strong>${totalPrice.toLocaleString()}</strong>
                </div>
              </div>
            </>
          )}

          {submitted ? (
            <div className="checkout-success">
              <h3>¡Compra simulada con éxito!</h3>
              <p>Gracias, {formData.name}. Enviamos la confirmación de prueba a {formData.email}.</p>
              <p>Tu pedido fue registrado como una demo y no se realizó ningún cobro real.</p>
              <Link href="/" style={{ marginTop: '20px', display: 'inline-block' }}>
                <button className="checkout-secondary-btn">Volver a la Tienda</button>
              </Link>
            </div>
          ) : null}
        </div>

        {!submitted && (
          <div className="checkout-panel">
            <div className="checkout-eyebrow">INFORMACIÓN</div>
            <h2>Datos de Contacto</h2>

            <form className="checkout-form" onSubmit={handleSubmit}>
              <label>Nombre Completo</label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Tu nombre"
              />

              <label>Email</label>
              <input 
                type="email" 
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="tu@email.com"
              />

              <label>Número de Tarjeta</label>
              <input 
                type="text" 
                placeholder="4532 1234 5678 9010"
                disabled
                value="4532 1234 5678 9010"
              />

              <div className="checkout-grid">
                <div>
                  <label>Vencimiento</label>
                  <input type="text" placeholder="12/26" disabled value="12/26" />
                </div>
                <div>
                  <label>CVV</label>
                  <input type="text" placeholder="123" disabled value="123" />
                </div>
              </div>

              <button type="submit" className="checkout-primary-btn">
                SIMULAR PAGO
              </button>
              <Link href="/">
                <button type="button" className="checkout-secondary-btn">
                  Volver al Carrito
                </button>
              </Link>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
