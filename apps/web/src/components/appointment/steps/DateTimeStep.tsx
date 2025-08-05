import React, { useState } from 'react';
import { useAppointmentStore } from '../../../stores/appointmentStore';

const timeSlots = [
  { id: 'morning', label: '上午時段', time: '10:00 - 12:00', icon: '🌅' },
  { id: 'afternoon', label: '下午時段', time: '14:00 - 17:00', icon: '☀️' },
  { id: 'evening', label: '晚上時段', time: '18:00 - 21:00', icon: '🌙' },
];

export default function DateTimeStep() {
  const { appointmentData, updateAppointmentData, nextStep } = useAppointmentStore();
  const [selectedDate, setSelectedDate] = useState(appointmentData.preferredDate);
  const [selectedTime, setSelectedTime] = useState(appointmentData.preferredTime);
  const [message, setMessage] = useState(appointmentData.message);

  // Get today's date and add 1 day for minimum selectable date
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  // Get max date (30 days from today)
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    updateAppointmentData({ preferredDate: date });
  };

  const handleTimeSelect = (timeId: string) => {
    setSelectedTime(timeId);
    updateAppointmentData({ preferredTime: timeId });
  };

  const handleMessageChange = (msg: string) => {
    setMessage(msg);
    updateAppointmentData({ message: msg });
  };

  const handleContinue = () => {
    if (selectedDate && selectedTime) {
      nextStep();
    }
  };

  const isWeekend = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday = 0, Saturday = 6
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = weekdays[date.getDay()];

    return `${month}月${day}日 (週${weekday})`;
  };

  return (
    <div className="text-center">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">選擇預約時間</h2>
        <p className="text-lg text-gray-600">請選擇您方便的日期和時段</p>
      </div>

      <div className="max-w-lg mx-auto space-y-8">
        {/* Date selection */}
        <div className="text-left">
          <label className="block text-lg font-medium text-gray-900 mb-4">選擇日期</label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => handleDateChange(e.target.value)}
            min={minDate}
            max={maxDateStr}
            className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
          />
          {selectedDate && (
            <div className="mt-2 flex items-center text-sm">
              <span className="text-gray-600">已選擇：</span>
              <span className="ml-2 font-medium">
                {formatDate(selectedDate)}
                {isWeekend(selectedDate) && (
                  <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                    週末
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Time slot selection */}
        <div className="text-left">
          <label className="block text-lg font-medium text-gray-900 mb-4">選擇時段</label>
          <div className="grid gap-3">
            {timeSlots.map(slot => (
              <div
                key={slot.id}
                onClick={() => handleTimeSelect(slot.id)}
                className={`
                  p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                  hover:border-black hover:shadow-md focus:outline-none focus:border-black
                  ${
                    selectedTime === slot.id
                      ? 'border-black bg-gray-50 shadow-md'
                      : 'border-gray-200 hover:bg-gray-50'
                  }
                `}
                tabIndex={0}
                onKeyPress={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleTimeSelect(slot.id);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{slot.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900">{slot.label}</div>
                      <div className="text-sm text-gray-600">{slot.time}</div>
                    </div>
                  </div>

                  {selectedTime === slot.id && (
                    <svg className="h-6 w-6 text-black" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Optional message */}
        <div className="text-left">
          <label className="block text-lg font-medium text-gray-900 mb-4">備註說明 (選填)</label>
          <textarea
            value={message}
            onChange={e => handleMessageChange(e.target.value)}
            placeholder="如有特殊需求或想了解的產品細節，請告訴我們..."
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none resize-none"
          />
        </div>
      </div>

      {/* Continue button */}
      <div className="mt-8">
        <button
          onClick={handleContinue}
          disabled={!selectedDate || !selectedTime}
          className="
            px-8 py-3 bg-black text-white rounded-lg font-medium text-lg
            hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        >
          確認預約資訊
        </button>
      </div>

      <div className="mt-6 text-sm text-gray-500 space-y-1">
        <p>📅 可預約時間：明天起30天內</p>
        <p>⏰ 門市營業時間：週一至週日 10:00-21:00</p>
      </div>
    </div>
  );
}
