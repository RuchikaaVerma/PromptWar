"use client";
import { useState } from 'react';
import { menuItems, MenuItem } from '../data/foodMenu';
import styles from '../page.module.css';

export default function FoodOrdering() {
  const [cart, setCart] = useState<{item: MenuItem, quantity: number}[]>([]);
  const [checkoutStep, setCheckoutStep] = useState(false);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) {
        return prev.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const getRecommendations = () => {
    if (cart.length === 0) return [];
    // Get recommendations from the last added item
    const lastItemId = cart[cart.length - 1].item.id;
    const itemData = menuItems.find(m => m.id === lastItemId);
    if (!itemData) return [];
    
    // Return actual items based on recommendation ids, excluding items already in cart
    const cartIds = cart.map(c => c.item.id);
    return itemData.recommendations
      .filter(recId => !cartIds.includes(recId))
      .map(recId => menuItems.find(m => m.id === recId)!)
      .slice(0, 2); // Max 2 recommendations
  };

  const total = cart.reduce((acc, curr) => acc + (curr.item.price * curr.quantity), 0);
  const recommendations = getRecommendations();

  // If order is placed
  if (checkoutStep) {
    return (
      <div style={{animation: 'popIn 0.5s backwards', display: 'flex', flexDirection: 'column', gap: '20px'}}>
        <h2 className="heading-stadium" style={{ fontSize: '1.8rem', color: 'var(--secondary)' }}>Order Confirmed!</h2>
        <div className="glass-card" style={{ padding: '24px' }}>
          <p className="heading-stadium" style={{ fontSize: '2rem', marginBottom: '8px' }}>#4902</p>
          <p style={{ color: 'var(--on-surface-variant)' }}>Estimated Pickup: <strong style={{color: 'white'}}>5 Minutes</strong></p>
          <p style={{ marginTop: '16px', fontSize: '0.9rem' }}>Head to the <strong style={{color: 'var(--primary)'}}>Express Bar @ Section 115</strong>. Skipping the line saves you 15 minutes.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'popIn 0.5s backwards' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="heading-stadium" style={{ fontSize: '1.5rem' }}>Express Menu</h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '8px' }}>
          Pickup: Sec 115
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {menuItems.map(item => (
          <div key={item.id} className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '2rem' }}>{item.emoji}</span>
              <h3 className="heading-stadium" style={{ fontSize: '1rem', marginTop: '8px' }}>{item.name}</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginTop: '4px', minHeight: '34px' }}>{item.description}</p>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
              <span className="heading-stadium" style={{ color: 'var(--primary)' }}>${item.price.toFixed(2)}</span>
              <button 
                onClick={() => addToCart(item)}
                style={{ background: 'var(--primary-container)', color: '#000', border: 'none', borderRadius: '8px', padding: '6px 12px', fontWeight: 'bold', cursor: 'pointer', transform: 'translateZ(10px)' }}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {recommendations.length > 0 && (
        <div style={{ marginTop: '12px', animation: 'slideDown 0.4s ease' }}>
          <h3 className="heading-stadium" style={{ fontSize: '1.1rem', color: 'var(--tertiary)', marginBottom: '12px' }}>Because you added that...</h3>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto' }}>
            {recommendations.map(item => (
              <div key={item.id} className="glass-card" style={{ padding: '12px', minWidth: '160px', flexShrink: 0, border: '1px solid var(--tertiary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{item.emoji} {item.name}</span>
                  <button onClick={() => addToCart(item)} style={{ background: 'transparent', color: 'var(--primary)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>+ Add</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cart Summary Bar */}
      {cart.length > 0 && (
        <div className="glass-card" style={{ position: 'sticky', bottom: '8px', padding: '16px', background: 'rgba(0, 219, 233, 0.15)', border: '1px solid var(--primary)', marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>{cart.reduce((a,c)=>a+c.quantity,0)} Items in Cart</p>
              <h3 className="heading-stadium" style={{ fontSize: '1.4rem' }}>Total: ${total.toFixed(2)}</h3>
            </div>
          </div>
          <button 
            className={styles.rerouteButton} 
            style={{ marginTop: 0 }}
            onClick={() => setCheckoutStep(true)}
          >
            Checkout & Skip Line
          </button>
        </div>
      )}

    </div>
  );
}
