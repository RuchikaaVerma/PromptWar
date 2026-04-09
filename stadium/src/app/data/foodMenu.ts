export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'quick-pick' | 'snack' | 'meal';
  emoji: string;
  recommendations: string[]; // IDs of recommended items
}

export const menuItems: MenuItem[] = [
  {
    id: 'f1',
    name: 'Draft Beer (IPA)',
    description: 'Local stadium brew, 16oz',
    price: 12.50,
    category: 'quick-pick',
    emoji: '🍺',
    recommendations: ['f3', 'f5'] // Recommends pretzels and nachos
  },
  {
    id: 'f2',
    name: 'Classic Hot Dog',
    description: 'Stadium style beef dog',
    price: 8.00,
    category: 'quick-pick',
    emoji: '🌭',
    recommendations: ['f4'] // Recommends fountain drink
  },
  {
    id: 'f3',
    name: 'Warm Pretzel',
    description: 'Salted with cheese dip',
    price: 6.50,
    category: 'snack',
    emoji: '🥨',
    recommendations: ['f1'] 
  },
  {
    id: 'f4',
    name: 'Fountain Soda',
    description: 'Large cola, diet or sprite',
    price: 5.00,
    category: 'quick-pick',
    emoji: '🥤',
    recommendations: ['f2', 'f6'] 
  },
  {
    id: 'f5',
    name: 'Loaded Nachos',
    description: 'Jalapenos, cheese, salsa',
    price: 10.50,
    category: 'snack',
    emoji: '🧀',
    recommendations: ['f1', 'f4'] 
  },
  {
    id: 'f6',
    name: 'Burger Combo',
    description: 'Double cheeseburger with fries',
    price: 18.00,
    category: 'meal',
    emoji: '🍔',
    recommendations: ['f4', 'f1'] 
  }
];
