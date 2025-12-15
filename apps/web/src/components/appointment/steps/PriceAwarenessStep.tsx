import type React from "react";
import { useAppointmentStore } from "../../../stores/appointmentStore";

export default function PriceAwarenessStep() {
  const { appointmentData, updateAppointmentData } = useAppointmentStore();

  const handleSelection = (priceAwareness: boolean) => {
    updateAppointmentData({ priceAwareness });
  };

  const handleKeyDown = (e: React.KeyboardEvent, value: boolean) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSelection(value);
    }
  };

  return (
    <div className="text-center">
      <div className="mb-8">
        <h2 className="mb-4 font-bold text-3xl text-gray-900">
          是否清楚黑標的價位都在十萬以上嗎?
        </h2>
        <p className="text-gray-600 text-lg">確保您對產品價位有正確的認知</p>
      </div>

      <div className="mx-auto max-w-md space-y-4">
        <button
          autoFocus
          className={`w-full cursor-pointer rounded-lg border-2 p-6 transition-all duration-200 hover:border-black hover:shadow-lg focus:border-black focus:shadow-lg focus:outline-none ${
            appointmentData.priceAwareness === true
              ? "border-black bg-gray-50 shadow-lg"
              : "border-gray-200 hover:bg-gray-50"
          }`}
          onClick={() => handleSelection(true)}
          onKeyDown={(e) => handleKeyDown(e, true)}
          type="button"
        >
          <div className="flex items-center justify-center gap-4">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                appointmentData.priceAwareness === true
                  ? "border-black bg-black"
                  : "border-gray-300"
              }`}
            >
              {appointmentData.priceAwareness === true && (
                <div className="h-2 w-2 rounded-full bg-white" />
              )}
            </div>
            <span className="font-medium text-gray-900 text-xl">是</span>
          </div>
        </button>

        <button
          className={`w-full cursor-pointer rounded-lg border-2 p-6 transition-all duration-200 hover:border-black hover:shadow-lg focus:border-black focus:shadow-lg focus:outline-none ${
            appointmentData.priceAwareness === false
              ? "border-black bg-gray-50 shadow-lg"
              : "border-gray-200 hover:bg-gray-50"
          }`}
          onClick={() => handleSelection(false)}
          onKeyDown={(e) => handleKeyDown(e, false)}
          type="button"
        >
          <div className="flex items-center justify-center gap-4">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                appointmentData.priceAwareness === false
                  ? "border-black bg-black"
                  : "border-gray-300"
              }`}
            >
              {appointmentData.priceAwareness === false && (
                <div className="h-2 w-2 rounded-full bg-white" />
              )}
            </div>
            <span className="font-medium text-gray-900 text-xl">否</span>
          </div>
        </button>

        <div className="mt-8 rounded-lg bg-blue-50 p-6">
          <div className="flex items-start gap-3">
            <svg
              aria-hidden="true"
              className="mt-0.5 h-6 w-6 flex-shrink-0 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
            <div className="text-left">
              <p className="font-medium text-blue-900 text-sm">價格資訊</p>
              <p className="mt-1 text-blue-800 text-sm">
                黑標床墊為高端產品,價位從 <strong>NT$100,000</strong> 起
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
