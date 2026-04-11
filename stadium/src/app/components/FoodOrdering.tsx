"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, CheckCircle, ArrowRight } from 'lucide-react';
import { menuItems, MenuItem } from '../data/foodMenu';

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
    const lastItemId = cart[cart.length - 1].item.id;
    const itemData = menuItems.find(m => m.id === lastItemId);
    if (!itemData) return [];
    
    const cartIds = cart.map(c => c.item.id);
    return itemData.recommendations
      .filter(recId => !cartIds.includes(recId))
      .map(recId => menuItems.find(m => m.id === recId)!)
      .slice(0, 2);
  };

  const total = cart.reduce((acc, curr) => acc + (curr.item.price * curr.quantity), 0);
  const recommendations = getRecommendations();

  if (checkoutStep) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ display: 'flex', flexDirection: 'column', gap: '30px', alignItems: 'center', textAlign: 'center' }}
      >
        <div style={{ background: 'rgba(0, 255, 255, 0.1)', padding: '40px', border: '1px solid var(--primary)', position: 'relative' }}>
          <CheckCircle size={48} style={{ color: '#00FFFF', display: 'block', margin: '0 auto 24px', filter: 'drop-shadow(0 0 12px rgba(0,255,255,0.6))' }} strokeWidth={1} />
          <h2 className="technical-text" style={{ fontSize: '2.5rem', color: '#fff', marginBottom: '10px' }}>PROTOCOL EXECUTED</h2>
          <p className="technical-text" style={{ fontSize: '0.8rem', color: 'var(--primary)', letterSpacing: '0.3em', marginBottom: '30px' }}>STATION 115 EXPRESS TERMINAL</p>
          
          <div style={{ borderTop: '1px solid var(--ghost-border)', paddingTop: '30px', textAlign: 'left' }}>
            <p className="technical-text" style={{ color: 'var(--on-surface-variant)', fontSize: '0.7rem' }}>ORDER TOKEN</p>
            <p className="technical-text" style={{ fontSize: '3rem', color: '#fff', margin: '10px 0' }}>#4902-AX</p>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Pickup ready in <strong style={{color: '#fff'}}>240 SECONDS</strong>. <br/>
              Bypassing main queue at Sector F. <br/>
              Target saved approx. <strong style={{color: 'var(--secondary)'}}>18 MINUTES</strong>.
            </p>
          </div>
        </div>
        <button 
           onClick={() => { setCart([]); setCheckoutStep(false); }}
           className="technical-text" 
           style={{ background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer', fontSize: '0.75rem', letterSpacing: '0.1em' }}
        >
          RETURN TO OVERVIEW
        </button>
      </motion.div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
           <p className="technical-text" style={{ fontSize: '0.65rem', color: 'var(--primary)', letterSpacing: '0.2em' }}>TERMINAL ALPHA-09</p>
           <h2 className="technical-text" style={{ fontSize: '2rem', color: '#fff' }}>EXPRESS INVENTORY</h2>
        </div>
        <div style={{ textAlign: 'right' }}>
           <p className="technical-text" style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)' }}>PICKUP LOCATION</p>
           <p className="technical-text" style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>SEC 115 BAR</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {menuItems.map(item => (
          <motion.div 
            whileHover={{ scale: 1.02 }}
            key={item.id} 
            style={{ 
              background: 'rgba(25, 27, 32, 0.4)', 
              border: '1px solid var(--ghost-border)', 
              padding: '24px', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between' 
            }}
          >
            <div>
              <span style={{ fontSize: '2.5rem', filter: 'grayscale(100%) brightness(200%)' }}>{item.emoji}</span>
              <h3 className="technical-text" style={{ fontSize: '1rem', color: '#fff', marginTop: '16px' }}>{item.name}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginTop: '8px', minHeight: '40px', lineHeight: '1.5' }}>{item.description}</p>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
              <span className="technical-text" style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>${item.price.toFixed(2)}</span>
              <button 
                onClick={() => addToCart(item)}
                className="technical-text"
                style={{ background: 'var(--primary)', color: '#000', border: 'none', padding: '10px 18px', fontWeight: '900', cursor: 'pointer' }}
              >
                ADD
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            style={{ 
              position: 'sticky', 
              bottom: '20px', 
              background: 'rgba(0, 0, 0, 0.9)', 
              border: '1px solid var(--primary)', 
              padding: '24px', 
              zIndex: 100,
              boxShadow: '0 0 30px rgba(0, 255, 255, 0.15)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                 <div style={{ background: 'var(--primary)', padding: '10px', color: '#000' }}>
                   <ShoppingCart size={20} />
                 </div>
                 <div>
                    <p className="technical-text" style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)' }}>CURRENT BATCH: {cart.reduce((a,c)=>a+c.quantity,0)} UNITS</p>
                    <h3 className="technical-text" style={{ fontSize: '1.8rem', color: '#fff' }}>${total.toFixed(2)}</h3>
                 </div>
              </div>
              <button 
                onClick={() => setCheckoutStep(true)}
                className="technical-text"
                style={{ 
                  background: 'var(--secondary)', 
                  color: '#000', 
                  padding: '16px 30px', 
                  fontSize: '1rem', 
                  fontWeight: '900', 
                  border: 'none', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                ENGAGE CHECKOUT <ArrowRight size={18} />
              </button>
            </div>

            {recommendations.length > 0 && (
              <div style={{ marginTop: '20px', borderTop: '1px solid var(--ghost-border)', paddingTop: '20px' }}>
                <p className="technical-text" style={{ fontSize: '0.65rem', color: 'var(--secondary)', marginBottom: '12px' }}>SUGGESTED OPTIMIZATIONS</p>
                <div style={{ display: 'flex', gap: '15px' }}>
                  {recommendations.map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255, 255, 255, 0.05)', padding: '10px 16px', border: '1px solid rgba(255, 0, 255, 0.2)' }}>
                      <span className="technical-text" style={{ fontSize: '0.75rem', color: '#fff' }}>{item.emoji} {item.name}</span>
                      <button 
                        onClick={() => addToCart(item)} 
                        style={{ background: 'transparent', color: 'var(--secondary)', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '900' }}
                      >
                        + UPLINK
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
