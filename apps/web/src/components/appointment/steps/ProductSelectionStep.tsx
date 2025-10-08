import React, { useState } from 'react';
import { useAppointmentStore } from '../../../stores/appointmentStore';

export default function ProductSelectionStep() {
  const { products, appointmentData, updateAppointmentData, nextStep } = useAppointmentStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('simmons-black');

  const categories = [
    { id: 'simmons-black', name: '席夢思黑標床墊', icon: '🛏️' },
    { id: 'accessories', name: '寢具配件', icon: '🛍️' },
    { id: 'us-imports', name: '美國進口商品', icon: '🇺🇸' },
  ];

  const filteredProducts = products.filter((product) => product.category === selectedCategory);

  const handleProductSelect = (product: (typeof products)[0]) => {
    updateAppointmentData({ selectedProduct: product });
    // Auto-advance to next step after selection
    setTimeout(() => nextStep(), 300);
  };

  const handleKeyPress = (e: React.KeyboardEvent, product: (typeof products)[0]) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleProductSelect(product);
    }
  };

  return (
    <div className="text-center">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">選擇試躺產品</h2>
        <p className="text-lg text-gray-600">請選擇您想要體驗的產品類型</p>
      </div>

      {/* Category tabs */}
      <div className="flex justify-center mb-8">
        <div className="flex bg-gray-100 rounded-lg p-1">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`
                px-6 py-2 rounded-md font-medium transition-colors
                ${
                  selectedCategory === category.id
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-600 hover:text-black'
                }
              `}
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div className="grid gap-4 max-w-2xl mx-auto">
        {filteredProducts.map((product, index) => (
          <div
            key={product.id}
            onClick={() => handleProductSelect(product)}
            onKeyPress={(e) => handleKeyPress(e, product)}
            tabIndex={0}
            className={`
              p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 text-left
              hover:border-black hover:shadow-lg focus:outline-none focus:border-black focus:shadow-lg
              ${
                appointmentData.selectedProduct?.id === product.id
                  ? 'border-black bg-gray-50 shadow-lg'
                  : 'border-gray-200 hover:bg-gray-50'
              }
            `}
            autoFocus={index === 0}
          >
            <div className="flex justify-between items-start">
              <div className="flex-grow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                <p className="text-gray-600 mb-4">{product.description}</p>

                {product.category === 'simmons-black' && (
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="px-2 py-1 bg-black text-white rounded text-xs font-medium mr-2">
                      BLACK LABEL
                    </span>
                    <span>專業睡眠顧問協助試躺</span>
                  </div>
                )}
              </div>

              {appointmentData.selectedProduct?.id === product.id && (
                <div className="flex items-center text-black ml-4">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredProducts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>此分類暫無可預約產品</p>
          </div>
        )}
      </div>

      <div className="mt-8 text-sm text-gray-500">
        <p>💡 提示：點擊產品卡片即可選擇並自動進入下一步</p>
      </div>
    </div>
  );
}
