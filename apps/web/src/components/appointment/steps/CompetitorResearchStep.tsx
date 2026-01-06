import type React from "react";
import { useState } from "react";
import { useAppointmentStore } from "../../../stores/appointmentStore";

export default function CompetitorResearchStep() {
  const { appointmentData, updateAppointmentData } = useAppointmentStore();
  const [showInput, setShowInput] = useState(
    appointmentData.hasTriedOtherStores === true
  );

  const handleSelection = (hasTriedOtherStores: boolean) => {
    updateAppointmentData({ hasTriedOtherStores });
    setShowInput(hasTriedOtherStores);
    if (!hasTriedOtherStores) {
      updateAppointmentData({ otherStoreNames: "" });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateAppointmentData({ otherStoreNames: e.target.value });
  };

  const handleKeyPress = (e: React.KeyboardEvent, value: boolean) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSelection(value);
    }
  };

  return (
    <div className="text-center">
      <div className="mb-8">
        <h2 className="mb-4 font-bold text-3xl text-gray-900">
          是否有去其他國內代購業者試躺過呢?
        </h2>
        <p className="text-gray-600 text-lg">
          了解您的購買經驗能幫助我們提供更好的服務
        </p>
      </div>

      <div className="mx-auto max-w-md space-y-4">
        <div
          autoFocus
          className={`cursor-pointer rounded-lg border-2 p-6 transition-all duration-200 hover:border-black hover:shadow-lg focus:border-black focus:shadow-lg focus:outline-none ${
            appointmentData.hasTriedOtherStores === true
              ? "border-black bg-gray-50 shadow-lg"
              : "border-gray-200 hover:bg-gray-50"
          }`}
          onClick={() => handleSelection(true)}
          onKeyPress={(e) => handleKeyPress(e, true)}
          tabIndex={0}
        >
          <div className="flex items-center justify-center gap-4">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                appointmentData.hasTriedOtherStores === true
                  ? "border-black bg-black"
                  : "border-gray-300"
              }`}
            >
              {appointmentData.hasTriedOtherStores === true && (
                <div className="h-2 w-2 rounded-full bg-white" />
              )}
            </div>
            <span className="font-medium text-gray-900 text-xl">是</span>
          </div>
        </div>

        <div
          className={`cursor-pointer rounded-lg border-2 p-6 transition-all duration-200 hover:border-black hover:shadow-lg focus:border-black focus:shadow-lg focus:outline-none ${
            appointmentData.hasTriedOtherStores === false
              ? "border-black bg-gray-50 shadow-lg"
              : "border-gray-200 hover:bg-gray-50"
          }`}
          onClick={() => handleSelection(false)}
          onKeyPress={(e) => handleKeyPress(e, false)}
          tabIndex={0}
        >
          <div className="flex items-center justify-center gap-4">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                appointmentData.hasTriedOtherStores === false
                  ? "border-black bg-black"
                  : "border-gray-300"
              }`}
            >
              {appointmentData.hasTriedOtherStores === false && (
                <div className="h-2 w-2 rounded-full bg-white" />
              )}
            </div>
            <span className="font-medium text-gray-900 text-xl">否</span>
          </div>
        </div>

        {showInput && (
          <div className="fade-in slide-in-from-top-2 mt-6 animate-in duration-300">
            <label
              className="mb-2 block text-left font-medium text-gray-700 text-sm"
              htmlFor="otherStoreNames"
            >
              請問是哪一間呢? (可以誠實回答沒關係)
            </label>
            <input
              className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 transition-colors focus:border-black focus:outline-none"
              id="otherStoreNames"
              onChange={handleInputChange}
              placeholder="例如: XX床墊店"
              type="text"
              value={appointmentData.otherStoreNames}
            />
          </div>
        )}
      </div>
    </div>
  );
}
