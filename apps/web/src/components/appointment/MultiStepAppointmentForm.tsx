import React from 'react';
import { useAppointmentStore } from '../../stores/appointmentStore';
import { Button } from '@blackliving/ui';
import AccountCheckStep from './steps/AccountCheckStep';
import StoreSelectionStep from './steps/StoreSelectionStep';
import ProductSelectionStep from './steps/ProductSelectionStep';
import PersonalInfoStep from './steps/PersonalInfoStep';
import DateTimeStep from './steps/DateTimeStep';
import ReviewStep from './steps/ReviewStep';

const steps = [
  { id: 'account', title: '帳戶檢查', component: AccountCheckStep },
  { id: 'store', title: '選擇門市', component: StoreSelectionStep },
  { id: 'product', title: '選擇產品', component: ProductSelectionStep },
  { id: 'personal', title: '個人資訊', component: PersonalInfoStep },
  { id: 'datetime', title: '預約時間', component: DateTimeStep },
  { id: 'review', title: '確認預約', component: ReviewStep },
];

export default function MultiStepAppointmentForm() {
  const { currentStep, nextStep, prevStep } = useAppointmentStore();
  
  const CurrentStepComponent = steps[currentStep]?.component;
  
  if (!CurrentStepComponent) {
    return <div>步驟不存在</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
          <span>步驟 {currentStep + 1} / {steps.length}</span>
          <span>{steps[currentStep]?.title}</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-black h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current step content */}
      <div className="bg-white rounded-lg shadow-lg p-8 min-h-[500px]">
        <CurrentStepComponent />
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 0}
          className="px-6"
        >
          上一步
        </Button>
        
        <div className="text-sm text-gray-500 self-center">
          按 Enter 繼續
        </div>
        
        {currentStep < steps.length - 1 && (
          <Button
            onClick={nextStep}
            className="px-6"
          >
            下一步
          </Button>
        )}
      </div>
    </div>
  );
}