import { BsLayersFill } from "react-icons/bs";
import { GiPillow } from "react-icons/gi";
import { IoBed } from "react-icons/io5";
import { useAppointmentStore } from "../../../stores/appointmentStore";

export default function AccessoriesStep() {
  const { appointmentData, updateAppointmentData } = useAppointmentStore();

  const accessories = [
    {
      value: "無" as const,
      label: "無",
      Icon: null,
      description: "不需要配件",
    },
    {
      value: "枕頭" as const,
      label: "枕頭",
      Icon: GiPillow,
      description: "頂級記憶枕",
    },
    {
      value: "寢具" as const,
      label: "寢具",
      Icon: BsLayersFill,
      description: "床單、被套等",
    },
    {
      value: "下墊" as const,
      label: "下墊",
      Icon: IoBed,
      description: "床墊下墊",
    },
  ];

  const handleAccessoryToggle = (
    accessory: "無" | "枕頭" | "寢具" | "下墊"
  ) => {
    const currentAccessories = appointmentData.accessories || [];

    if (accessory === "無") {
      // If "無" is selected, clear all other selections
      if (currentAccessories.includes("無")) {
        updateAppointmentData({ accessories: [] });
      } else {
        updateAppointmentData({ accessories: ["無"] });
      }
    } else {
      // Remove "無" if selecting any other accessory
      const filteredAccessories = currentAccessories.filter(
        (item) => item !== "無"
      );

      if (filteredAccessories.includes(accessory)) {
        // Remove the accessory if already selected
        updateAppointmentData({
          accessories: filteredAccessories.filter((item) => item !== accessory),
        });
      } else {
        // Add the accessory
        updateAppointmentData({
          accessories: [...filteredAccessories, accessory],
        });
      }
    }
  };

  const isSelected = (accessory: "無" | "枕頭" | "寢具" | "下墊") =>
    (appointmentData.accessories || []).includes(accessory);

  return (
    <div className="text-center">
      <div className="mb-8">
        <h2 className="mb-4 font-bold text-3xl text-gray-900">
          是否有枕頭寢具下墊需求
        </h2>
        <p className="text-gray-600 text-lg">
          可複選多個配件,或選擇「無」跳過此步驟
        </p>
      </div>

      <div className="mx-auto grid max-w-2xl gap-4">
        {accessories.map((item, index) => (
          <button
            autoFocus={index === 0}
            className={`w-full cursor-pointer rounded-lg border-2 p-6 text-left transition-all duration-200 hover:border-black hover:shadow-lg focus:border-black focus:shadow-lg focus:outline-none ${
              isSelected(item.value)
                ? "border-black bg-gray-50 shadow-lg"
                : "border-gray-200 hover:bg-gray-50"
            }`}
            key={item.value}
            onClick={() => handleAccessoryToggle(item.value)}
            type="button"
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded border-2 transition-all ${
                  isSelected(item.value)
                    ? "border-black bg-black"
                    : "border-gray-300"
                }`}
              >
                {isSelected(item.value) && (
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M5 13l4 4L19 7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                    />
                  </svg>
                )}
              </div>
              {!!item.Icon && <item.Icon className="h-8 w-8 text-gray-700" />}
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900 text-xl">
                  {item.label}
                </h3>
                <p className="mt-1 text-gray-600 text-sm">{item.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 text-gray-500 text-sm">
        已選擇:{" "}
        {(appointmentData.accessories?.length ?? 0) === 0
          ? "無"
          : appointmentData.accessories?.join(", ")}
      </div>
    </div>
  );
}
