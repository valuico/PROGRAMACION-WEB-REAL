import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const Cart = ({ isOpen, onClose }) => {
  const [cart, setCart] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('hazeCart') || '[]');
    setCart(savedCart);
  }, [isOpen]);

  const removeFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
    localStorage.setItem('hazeCart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const goToPayment = () => {
    if (cart.length === 0) {
      alert("El carrito está vacío");
      return;
    }
    onClose();
    router.push('/payment');
  };

  const total = cart.reduce((acc, item) => acc + item.precio, 0);

  return (
    <>
      <div id="cart-overlay" style={{ display: isOpen ? 'block' : 'none' }} onClick={onClose}></div>
      <div id="side-cart" className={isOpen ? 'open' : ''}>
        <div className="cart-header">
          <h3>Tu Carrito</h3>
          <span className="close-cart" onClick={onClose}>&times;</span>
        </div>

        <div id="cart-items-container" className="cart-body">
          {cart.length === 0 ? (
            <p className="empty-msg">Tu carrito está vacío.</p>
          ) : (
            cart.map((item, index) => (
              <div key={index} style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                <img src={item.imagen} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} alt={item.nombre} />
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '14px', margin: 0, color: '#333' }}>{item.nombre}</h4>
                  <p style={{ fontSize: '12px', color: '#95789b', margin: '4px 0' }}>Tono: {item.tono}</p>
                  <span style={{ fontWeight: 'bold', color: '#d4af37' }}>${item.precio.toLocaleString()}</span>
                </div>
                <button onClick={() => removeFromCart(index)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '20px' }}>&times;</button>
              </div>
            ))
          )}
        </div>

        <div className="cart-footer">
          <div className="cart-total">
            <span>Total:</span>
            <span id="cart-total-amount">${total.toLocaleString()}</span>
          </div>
          <button className="btn-checkout" onClick={goToPayment}>Finalizar Compra</button>
          <p className="payment-methods">Aceptamos tarjetas de crédito, débito y transferencia.</p>
        </div>
      </div>
    </>
  );
};

export default Cart;