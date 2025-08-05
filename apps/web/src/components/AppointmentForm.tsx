import React, { useState } from 'react';
import { z } from 'zod';
import { Button } from '@blackliving/ui';

// Appointment form validation schema
const appointmentSchema = z.object({
  name: z.string().min(2, '姓名至少2個字符'),
  phone: z.string().min(10, '請輸入有效的電話號碼'),
  email: z.string().email('請輸入有效的Email地址').optional(),
  store: z.enum(['zhonghe', 'zhongli'], { message: '請選擇門市' }),
  preferredDate: z.string().min(1, '請選擇偏好日期'),
  preferredTime: z.enum(['morning', 'afternoon', 'evening'], { message: '請選擇時段' }),
  message: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  onSubmit?: (data: AppointmentFormData) => void;
  className?: string;
}

export default function AppointmentForm({ onSubmit, className = '' }: AppointmentFormProps) {
  const [formData, setFormData] = useState<Partial<AppointmentFormData>>({});
  const [errors, setErrors] = useState<Partial<Record<keyof AppointmentFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name as keyof AppointmentFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const validatedData = appointmentSchema.parse(formData);

      // Call API or parent handler
      if (onSubmit) {
        await onSubmit(validatedData);
      } else {
        // Default API call
        const response = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validatedData),
        });

        if (!response.ok) {
          throw new Error('預約提交失敗');
        }

        alert('預約已成功提交！我們將盡快與您聯繫。');
        setFormData({});
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof AppointmentFormData, string>> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof AppointmentFormData] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        alert('預約提交失敗，請稍後再試');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow-lg ${className}`}>
      <h3 className="text-2xl font-bold text-gray-900 mb-6">預約試躺</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            姓名 *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name || ''}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="請輸入您的姓名"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            電話 *
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone || ''}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="請輸入您的電話號碼"
          />
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email || ''}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="請輸入您的Email（選填）"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        {/* Store Selection */}
        <div>
          <label htmlFor="store" className="block text-sm font-medium text-gray-700 mb-1">
            門市選擇 *
          </label>
          <select
            id="store"
            name="store"
            value={formData.store || ''}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">請選擇門市</option>
            <option value="zhonghe">中和展間</option>
            <option value="zhongli">中壢展間</option>
          </select>
          {errors.store && <p className="text-red-500 text-sm mt-1">{errors.store}</p>}
        </div>

        {/* Preferred Date */}
        <div>
          <label htmlFor="preferredDate" className="block text-sm font-medium text-gray-700 mb-1">
            偏好日期 *
          </label>
          <input
            type="date"
            id="preferredDate"
            name="preferredDate"
            value={formData.preferredDate || ''}
            onChange={handleInputChange}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
          />
          {errors.preferredDate && (
            <p className="text-red-500 text-sm mt-1">{errors.preferredDate}</p>
          )}
        </div>

        {/* Preferred Time */}
        <div>
          <label htmlFor="preferredTime" className="block text-sm font-medium text-gray-700 mb-1">
            偏好時段 *
          </label>
          <select
            id="preferredTime"
            name="preferredTime"
            value={formData.preferredTime || ''}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">請選擇時段</option>
            <option value="morning">上午 (9:00-12:00)</option>
            <option value="afternoon">下午 (13:00-17:00)</option>
            <option value="evening">晚上 (18:00-21:00)</option>
          </select>
          {errors.preferredTime && (
            <p className="text-red-500 text-sm mt-1">{errors.preferredTime}</p>
          )}
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            備註
          </label>
          <textarea
            id="message"
            name="message"
            rows={3}
            value={formData.message || ''}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="如有特殊需求請告知我們"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-black text-white py-3 px-4 rounded-md font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? '提交中...' : '預約試躺'}
        </button>
      </form>

      <div className="mt-4 text-sm text-gray-600 text-center">
        <p>我們將在收到預約後24小時內與您聯繫確認時間</p>
      </div>
    </div>
  );
}
