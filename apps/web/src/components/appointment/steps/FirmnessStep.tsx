import { GoDot, GoDotFill } from "react-icons/go";
import { useAppointmentStore } from "../../../stores/appointmentStore";

export default function FirmnessStep() {
  const { appointmentData, updateAppointmentData } = useAppointmentStore();

  const firmnesses = [
    {
      value: "偏硬" as const,
      label: "偏硬",
      description: "提供強力支撐,適合喜歡硬床的您",
      dots: [GoDotFill, GoDotFill, GoDotFill],
    },
    {
      value: "中等" as const,
      label: "中等",
      description: "平衡舒適與支撐,最受歡迎的選擇",
      dots: [GoDot, GoDotFill, GoDotFill],
    },
    {
      value: "偏軟" as const,
      label: "偏軟",
      description: "雲朵般的柔軟觸感,舒適包覆",
      dots: [GoDot, GoDot, GoDotFill],
    },
  ];

  const handleFirmnessSelect = (firmness: "偏硬" | "中等" | "偏軟") => {
    updateAppointmentData({ firmness });
  };

  return (
    <div className="text-center">
      <div className="mb-8">
        <h2 className="mb-4 font-bold text-3xl text-gray-900">
          請問喜歡哪種軟硬度呢?
        </h2>
        <p className="mb-2 font-medium text-gray-700 text-lg">
          席夢思黑標 BLACK LABEL
        </p>
        <p className="text-gray-600">專為追求支撐與舒適的您打造</p>
      </div>

      <div className="mx-auto grid max-w-2xl gap-4">
        {firmnesses.map((item, index) => (
          <button
            autoFocus={index === 0}
            className={`w-full cursor-pointer rounded-lg border-2 p-6 text-left transition-all duration-200 hover:border-black hover:shadow-lg focus:border-black focus:shadow-lg focus:outline-none ${
              appointmentData.firmness === item.value
                ? "border-black bg-gray-50 shadow-lg"
                : "border-gray-200 hover:bg-gray-50"
            }`}
            key={item.value}
            onClick={() => handleFirmnessSelect(item.value)}
            type="button"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-0">
                {item.dots.map((DotIcon, idx) => (
                  <DotIcon
                    className="h-8 w-8 text-gray-700"
                    key={`${item.value}-dot-${idx}`}
                  />
                ))}
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900 text-xl">
                  {item.label}
                </h3>
                <p className="mt-1 text-gray-600 text-sm">{item.description}</p>
              </div>
              {appointmentData.firmness === item.value && (
                <svg
                  aria-labelledby="checkmark-title"
                  className="h-6 w-6 flex-shrink-0 text-black"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <title id="checkmark-title">已選擇</title>
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
