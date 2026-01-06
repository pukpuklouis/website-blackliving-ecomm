import { Button } from "@blackliving/ui";
import { useAppointmentStore } from "../../../stores/appointmentStore";

export default function StoreSelectionStep() {
  const { stores, appointmentData, updateAppointmentData, nextStep } =
    useAppointmentStore();

  const handleStoreSelect = (store: (typeof stores)[0]) => {
    updateAppointmentData({ selectedStore: store });
  };

  return (
    <div className="text-center">
      <div className="mb-8">
        <h2 className="mb-4 font-bold text-3xl text-gray-900">選擇試躺門市</h2>
        <p className="text-gray-600 text-lg">請選擇最方便的門市位置</p>
      </div>

      <div className="mx-auto grid max-w-2xl gap-6">
        {stores.map((store, index) => (
          <button
            autoFocus={index === 0}
            className={`w-full cursor-pointer rounded-lg border-2 p-6 text-left transition-all duration-200 hover:border-black hover:shadow-lg focus:border-black focus:shadow-lg focus:outline-none ${
              appointmentData.selectedStore?.id === store.id
                ? "border-black bg-gray-50 shadow-lg"
                : "border-gray-200 hover:bg-gray-50"
            }
            `}
            key={store.id}
            onClick={() => handleStoreSelect(store)}
            type="button"
          >
            <div className="text-left">
              <h3 className="mb-2 font-semibold text-gray-900 text-xl">
                {store.name}
              </h3>

              <div className="space-y-2 text-gray-600">
                <div className="flex items-start">
                  <svg
                    aria-hidden="true"
                    className="mt-0.5 mr-2 h-5 w-5 flex-shrink-0 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                    <path
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                  <span>{store.address}</span>
                </div>
              </div>

              {appointmentData.selectedStore?.id === store.id && (
                <div className="mt-4 flex items-center text-black">
                  <svg
                    aria-hidden="true"
                    className="mr-2 h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      clipRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      fillRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium">已選擇</span>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <Button
          className="px-8 py-2"
          disabled={!appointmentData.selectedStore}
          onClick={nextStep}
        >
          下一步：選擇產品
        </Button>
      </div>
    </div>
  );
}
