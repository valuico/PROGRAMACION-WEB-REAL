import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const Payment = () => {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('hazeCart') || '[]');
    setCart(savedCart);
    setTotal(savedCart.reduce((acc, item) => acc + item.precio, 0));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate payment
    localStorage.removeItem('hazeCart');
    alert('Compra simulada con éxito');
    router.push('/');
  };

  const goBack = () => {
    router.push('/');
  };

  if (cart.length === 0) {
    return (
      <main className="checkout-layout">
        <section className="checkout-panel checkout-summary-panel">
          <span className="checkout-eyebrow">Simulación de compra</span>
          <h1>No hay productos para pagar</h1>
          <p className="checkout-intro">Agregá artículos al carrito para simular una compra.</p>
          <button className="checkout-secondary-btn" onClick={goBack}>Volver a la tienda</button>
        </section>
      </main>
    );
  }

  return (
    <main className="checkout-layout">
      <section className="checkout-panel checkout-summary-panel">
        <span className="checkout-eyebrow">Simulación de compra</span>
        <h1>Finalizá tu pedido de prueba</h1>
        <p className="checkout-intro">Esta pantalla simula una plataforma externa de pago. Podés completar el formulario para probar el flujo sin realizar un cobro real.</p>

        <div id="checkout-items" className="checkout-items">
          {cart.map((item, index) => (
            <article key={index} className="checkout-item">
              <img src={item.imagen} alt={item.nombre} />
              <div>
                <h4>{item.nombre}</h4>
                <p>Tono: {item.tono}</p>
                <span>${item.precio.toLocaleString()}</span>
              </div>
            </article>
          ))}
        </div>

        <div className="checkout-totals">
          <div>
            <span>Total</span>
            <strong>${total.toLocaleString()}</strong>
          </div>
        </div>

        <button className="checkout-secondary-btn" onClick={goBack}>Volver a la tienda</button>
      </section>

      <section className="checkout-panel">
        <h2>Datos de pago</h2>
        <form className="checkout-form" onSubmit={handleSubmit}>
          <label htmlFor="checkout-name">Nombre completo</label>
          <input id="checkout-name" type="text" placeholder="Ej: Valentina Iconomopulos" required />

          <label htmlFor="checkout-email">Email</label>
          <input id="checkout-email" type="email" placeholder="Ej: valentina@email.com" required />

          <label htmlFor="checkout-card">Tarjeta</label>
          <input id="checkout-card" type="text" inputMode="numeric" placeholder="4111 1111 1111 1111" required />

          <div className="checkout-grid">
            <div>
              <label htmlFor="checkout-expiry">Vencimiento</label>
              <input id="checkout-expiry" type="text" placeholder="12/28" required />
            </div>
            <div>
              <label htmlFor="checkout-cvv">CVV</label>
              <input id="checkout-cvv" type="text" inputMode="numeric" placeholder="123" required />
            </div>
          </div>

          <label htmlFor="checkout-method">Método</label>
          <select id="checkout-method" required>
            <option value="credito">Tarjeta de crédito</option>
            <option value="debito">Tarjeta de débito</option>
            <option value="transferencia">Transferencia bancaria</option>
          </select>

          <button className="checkout-primary-btn" type="submit">Confirmar compra simulada</button>
        </form>
      </section>
    </main>
  );
};

export default Payment;