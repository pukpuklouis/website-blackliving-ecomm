import React from 'react';
import { useAppointmentStore } from '../../../stores/appointmentStore';

export default function StoreSelectionStep() {
  const { stores, appointmentData, updateAppointmentData, nextStep } = useAppointmentStore();

  const handleStoreSelect = (store: typeof stores[0]) => {
    updateAppointmentData({ selectedStore: store });
    // Auto-advance to next step after selection
    setTimeout(() => nextStep(), 300);
  };

  const handleKeyPress = (e: React.KeyboardEvent, store: typeof stores[0]) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleStoreSelect(store);
    }
  };

  return (
    <div className="text-center">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          選擇試躺門市
        </h2>
        <p className="text-lg text-gray-600">
          請選擇最方便的門市位置
        </p>
      </div>

      <div className="grid gap-6 max-w-2xl mx-auto">
        {stores.map((store, index) => (
          <div
            key={store.id}
            onClick={() => handleStoreSelect(store)}
            onKeyPress={(e) => handleKeyPress(e, store)}
            tabIndex={0}
            className={`
              p-6 rounded-lg border-2 cursor-pointer transition-all duration-200
              hover:border-black hover:shadow-lg focus:outline-none focus:border-black focus:shadow-lg
              ${appointmentData.selectedStore?.id === store.id 
                ? 'border-black bg-gray-50 shadow-lg' 
                : 'border-gray-200 hover:bg-gray-50'
              }
            `}
            autoFocus={index === 0}
          >
            <div className="text-left">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {store.name}
              </h3>
              
              <div className="space-y-2 text-gray-600">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-gray-400 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{store.address}</span>
                </div>
                
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{store.phone}</span>
                </div>
                
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{store.hours}</span>
                </div>
              </div>
              
              {appointmentData.selectedStore?.id === store.id && (
                <div className="mt-4 flex items-center text-black">
                  <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">已選擇</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-sm text-gray-500">
        <p>💡 提示：點擊門市卡片即可選擇並自動進入下一步</p>
      </div>
    </div>
  );
}