import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storagedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:cart',
      );

      if (storagedProducts) {
        setProducts(JSON.parse(storagedProducts));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const product = products.find(p => p.id === id);

      if (product) {
        const newProducts = [...products];
        newProducts[products.indexOf(product)].quantity += 1;
        setProducts(newProducts);

        await AsyncStorage.setItem(
          '@GoMarketplace:cart',
          JSON.stringify(products),
        );
      }
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const product = products.find(p => p.id === id);
      let newProducts = [...products];

      if (product) {
        if (product.quantity === 1) {
          newProducts = products.filter(p => p.id !== id);
        } else {
          newProducts[products.indexOf(product)].quantity -= 1;
        }

        setProducts(newProducts);

        await AsyncStorage.setItem(
          '@GoMarketplace:cart',
          JSON.stringify(products),
        );
      }
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const foundProduct = products.find(p => p.id === product.id);

      if (foundProduct) {
        increment(foundProduct.id);
        return;
      }

      setProducts(state => [
        ...state,
        {
          ...product,
          quantity: 1,
        },
      ]);

      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify([
          ...products,
          {
            ...product,
            quantity: 1,
          },
        ]),
      );
    },
    [increment, products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
