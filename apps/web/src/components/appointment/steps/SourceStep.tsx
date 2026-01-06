import { FaUserFriends } from "react-icons/fa";
import { FaComments } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import { SiShopee } from "react-icons/si";
import { useAppointmentStore } from "../../../stores/appointmentStore";

export default function SourceStep() {
  const { appointmentData, updateAppointmentData } = useAppointmentStore();

  const sources = [
    { value: "社群" as const, label: "社群", Icon: FaComments },
    { value: "朋友介紹" as const, label: "朋友介紹", Icon: FaUserFriends },
    { value: "Google" as const, label: "Google", Icon: FcGoogle },
    { value: "蝦皮" as const, label: "蝦皮", Icon: SiShopee },
  ];

  const handleSourceSelect = (
    source: "社群" | "朋友介紹" | "Google" | "蝦皮"
  ) => {
    updateAppointmentData({ source });
  };

  return (
    <div className="text-center">
      <div className="mb-8">
        <h2 className="mb-4 font-bold text-3xl text-gray-900">
          您是從哪裡知道黑哥的呢?
        </h2>
        <p className="text-gray-600 text-lg">請選擇您是如何得知黑標的</p>
      </div>

      <div className="mx-auto grid max-w-md gap-4">
        {sources.map((source, index) => (
          <button
            autoFocus={index === 0}
            className={`cursor-pointer rounded-lg border-2 p-6 text-left transition-all duration-200 hover:border-black hover:shadow-lg focus:border-black focus:shadow-lg focus:outline-none ${
              appointmentData.source === source.value
                ? "border-black bg-gray-50 shadow-lg"
                : "border-gray-200 hover:bg-gray-50"
            }`}
            key={source.value}
            onClick={() => handleSourceSelect(source.value)}
            type="button"
          >
            <div className="flex items-center justify-center gap-4">
              <source.Icon className="h-8 w-8 text-gray-700" />
              <span className="font-medium text-gray-900 text-xl">
                {source.label}
              </span>
              {appointmentData.source === source.value && (
                <svg
                  aria-hidden="true"
                  className="ml-auto h-6 w-6 text-black"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    clipRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    fillRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
