import React, { useState, useEffect } from 'react';
import { useAppointmentStore } from '../../../stores/appointmentStore';
import { z } from 'zod';

const personalInfoSchema = z.object({
  name: z.string().min(2, '姓名至少需要2個字符'),
  phone: z.string().min(10, '請輸入有效的電話號碼'),
  email: z.string().email('請輸入有效的Email地址'),
});

export default function PersonalInfoStep() {
  const { appointmentData, updateAppointmentData, nextStep } = useAppointmentStore();
  const [formData, setFormData] = useState({
    name: appointmentData.name,
    phone: appointmentData.phone,
    email: appointmentData.email,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentField, setCurrentField] = useState<'name' | 'phone' | 'email'>('name');

  useEffect(() => {
    setFormData({
      name: appointmentData.name,
      phone: appointmentData.phone,
      email: appointmentData.email,
    });
  }, [appointmentData]);

  const validateField = (field: keyof typeof formData, value: string) => {
    try {
      if (field === 'name') {
        personalInfoSchema.shape.name.parse(value);
      } else if (field === 'phone') {
        personalInfoSchema.shape.phone.parse(value);
      } else if (field === 'email') {
        personalInfoSchema.shape.email.parse(value);
      }
      setErrors((prev) => ({ ...prev, [field]: '' }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors((prev) => ({ ...prev, [field]: error.errors[0].message }));
      }
      return false;
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    updateAppointmentData({ [field]: value });

    // Clear error when user starts typing
    if (errors[field]) {
      validateField(field, value);
    }
  };

  const handleNext = () => {
    const nameValid = validateField('name', formData.name);
    const phoneValid = validateField('phone', formData.phone);
    const emailValid = validateField('email', formData.email);

    if (nameValid && phoneValid && emailValid) {
      nextStep();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (currentField === 'name' && formData.name.trim()) {
        setCurrentField('phone');
        document.getElementById('phone-input')?.focus();
      } else if (currentField === 'phone' && formData.phone.trim()) {
        setCurrentField('email');
        document.getElementById('email-input')?.focus();
      } else if (currentField === 'email' && formData.email.trim()) {
        handleNext();
      }
    }
  };

  return (
    <div className="text-center">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">填寫聯絡資訊</h2>
        <p className="text-lg text-gray-600">我們需要您的基本資訊以安排預約</p>
      </div>

      <div className="max-w-md mx-auto space-y-8">
        {/* Name field */}
        <div className="text-left">
          <label className="block text-sm font-medium text-gray-700 mb-2">姓名 *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => setCurrentField('name')}
            placeholder="請輸入您的姓名"
            className={`
              w-full px-0 py-3 text-lg border-0 border-b-2 bg-transparent focus:outline-none focus:ring-0 transition-colors
              ${
                errors.name
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:border-black'
              }
            `}
            autoFocus
          />
          {errors.name && <p className="text-red-500 text-sm mt-2">{errors.name}</p>}
        </div>

        {/* Phone field */}
        <div className="text-left">
          <label className="block text-sm font-medium text-gray-700 mb-2">電話號碼 *</label>
          <input
            id="phone-input"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => setCurrentField('phone')}
            placeholder="0912-345-678"
            className={`
              w-full px-0 py-3 text-lg border-0 border-b-2 bg-transparent focus:outline-none focus:ring-0 transition-colors
              ${
                errors.phone
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:border-black'
              }
            `}
          />
          {errors.phone && <p className="text-red-500 text-sm mt-2">{errors.phone}</p>}
        </div>

        {/* Email field (editable) */}
        <div className="text-left">
          <label className="block text-sm font-medium text-gray-700 mb-2">Email 地址 *</label>
          <input
            id="email-input"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => setCurrentField('email')}
            placeholder="your@email.com"
            className={`
              w-full px-0 py-3 text-lg border-0 border-b-2 bg-transparent focus:outline-none focus:ring-0 transition-colors
              ${
                errors.email
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:border-black'
              }
            `}
          />
          {errors.email && <p className="text-red-500 text-sm mt-2">{errors.email}</p>}
          <p className="text-sm text-gray-500 mt-1">來自第一步驟，如需修改請直接編輯</p>
        </div>
      </div>

      {/* Continue button */}
      <div className="mt-8">
        <button
          onClick={handleNext}
          disabled={
            !formData.name.trim() ||
            !formData.phone.trim() ||
            !formData.email.trim() ||
            Object.values(errors).some((error) => error)
          }
          className="
            px-8 py-3 bg-black text-white rounded-lg font-medium
            hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        >
          繼續填寫預約時間
        </button>
      </div>

      <div className="mt-6 text-sm text-gray-500">
        <p>💡 提示：按 Enter 鍵可以快速切換到下一個欄位</p>
      </div>
    </div>
  );
}
