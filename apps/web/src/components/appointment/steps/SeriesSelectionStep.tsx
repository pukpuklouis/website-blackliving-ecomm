import { useAppointmentStore } from "../../../stores/appointmentStore";

export default function SeriesSelectionStep() {
  const { appointmentData, updateAppointmentData } = useAppointmentStore();

  const series = [
    {
      value: "一系列" as const,
      label: "一系列",
      subtitle: "基礎",
      description: "經典入門選擇",
    },
    {
      value: "二系列" as const,
      label: "二系列",
      subtitle: "入門",
      description: "舒適與品質的平衡",
    },
    {
      value: "三系列" as const,
      label: "三系列",
      subtitle: "中階",
      description: "進階舒適體驗",
    },
    {
      value: "四系列" as const,
      label: "四系列",
      subtitle: "高階",
      description: "頂級睡眠享受",
    },
  ];

  const handleSeriesSelect = (
    selectedSeries: "一系列" | "二系列" | "三系列" | "四系列"
  ) => {
    updateAppointmentData({ series: selectedSeries });
  };

  return (
    <div className="text-center">
      <div className="mb-8">
        <h2 className="mb-4 font-bold text-3xl text-gray-900">
          請問想看哪款床墊呢?
        </h2>
        <p className="text-gray-600 text-lg">選擇您感興趣的床墊系列</p>
      </div>

      <div className="mx-auto grid max-w-2xl gap-4">
        {series.map((item, index) => (
          <button
            autoFocus={index === 0}
            className={`w-full cursor-pointer rounded-lg border-2 p-6 text-left transition-all duration-200 hover:border-black hover:shadow-lg focus:border-black focus:shadow-lg focus:outline-none ${
              appointmentData.series === item.value
                ? "border-black bg-gray-50 shadow-lg"
                : "border-gray-200 hover:bg-gray-50"
            }`}
            key={item.value}
            onClick={() => handleSeriesSelect(item.value)}
            type="button"
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <div className="flex items-baseline gap-2">
                  <h3 className="font-semibold text-gray-900 text-xl">
                    {item.label}
                  </h3>
                  <span className="rounded-full bg-gray-200 px-3 py-1 font-medium text-gray-700 text-xs">
                    {item.subtitle}
                  </span>
                </div>
                <p className="mt-1 text-gray-600 text-sm">{item.description}</p>
              </div>
              {appointmentData.series === item.value && (
                <svg
                  aria-hidden="true"
                  className="h-6 w-6 flex-shrink-0 text-black"
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
