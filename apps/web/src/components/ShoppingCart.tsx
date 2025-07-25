import { useState } from 'react';
import type { FC } from 'react';

interface CartItem {
  id: string;
  name: string;
  variant: string;
  price: number;
  quantity: number;
  image: string;
}

const ShoppingCart: FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: '1',
      name: '席夢思黑標 S2 床墊',
      variant: '標準雙人 152cm - 中等偏軟',
      price: 45000,
      quantity: 1,
      image: '/images/simmons-black-s2-1.jpg'
    }
  ]);

  const updateQuantity = (id: string, newQuantity: number) => {
    setCartItems(items => 
      items.map(item => 
        item.id === id ? { ...item, quantity: Math.max(0, newQuantity) } : item
      ).filter(item => item.quantity > 0)
    );
  };

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="max-w-4xl mx-auto">
      {cartItems.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">購物車是空的</h2>
          <p className="text-gray-500 mb-8">快去選購您喜愛的床墊吧！</p>
          <a 
            href="/simmons-black" 
            className="inline-block bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            開始購物
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-semibold mb-6">購物車項目</h2>
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center space-x-4">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <p className="text-gray-600 text-sm">{item.variant}</p>
                      <p className="text-lg font-bold mt-2">NT$ {item.price.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 bg-gray-100 rounded">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-md sticky top-4">
              <h2 className="text-xl font-semibold mb-4">訂單摘要</h2>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>小計</span>
                  <span>NT$ {total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>運費</span>
                  <span>免運費</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between text-lg font-semibold">
                  <span>總計</span>
                  <span>NT$ {total.toLocaleString()}</span>
                </div>
              </div>
              
              <button className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors mb-3">
                前往結帳
              </button>
              
              <a 
                href="/simmons-black" 
                className="block text-center text-gray-600 hover:underline"
              >
                繼續購物
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingCart;