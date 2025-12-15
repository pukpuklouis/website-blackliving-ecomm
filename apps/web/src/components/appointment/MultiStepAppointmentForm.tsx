import { Button } from "@blackliving/ui";
import { useEffect, useState } from "react";
import { useAppointmentStore } from "../../stores/appointmentStore";
import AuthModal from "../auth/AuthModal";
import AccessoriesStep from "./steps/AccessoriesStep";
import CompetitorResearchStep from "./steps/CompetitorResearchStep";

import FirmnessStep from "./steps/FirmnessStep";
import PersonalInfoStep from "./steps/PersonalInfoStep";
import PriceAwarenessStep from "./steps/PriceAwarenessStep";
import ReviewStep from "./steps/ReviewStep";
import SeriesSelectionStep from "./steps/SeriesSelectionStep";
import SourceStep from "./steps/SourceStep";
import StoreSelectionStep from "./steps/StoreSelectionStep";

const steps = [
  { id: "store", title: "選擇門市展間", component: StoreSelectionStep },
  { id: "source", title: "來源渠道", component: SourceStep },
  {
    id: "competitor",
    title: "試躺經驗",
    component: CompetitorResearchStep,
  },
  { id: "price", title: "價格認知", component: PriceAwarenessStep },
  { id: "series", title: "選擇系列", component: SeriesSelectionStep },
  { id: "firmness", title: "軟硬偏好", component: FirmnessStep },
  { id: "accessories", title: "配件需求", component: AccessoriesStep },
  { id: "personal", title: "個人資訊", component: PersonalInfoStep },

  { id: "review", title: "確認預約", component: ReviewStep },
];

export default function MultiStepAppointmentForm() {
  const { currentStep, nextStep, prevStep } = useAppointmentStore();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const CurrentStepComponent = steps[currentStep]?.component;

  useEffect(() => {
    const handler = () => setAuthModalOpen(true);
    window.addEventListener("reservation-auth-required", handler);
    return () =>
      window.removeEventListener("reservation-auth-required", handler);
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (authModalOpen) {
        return;
      }

      // Next step: Enter or Right Arrow
      if (
        (e.key === "Enter" || e.key === "ArrowRight") &&
        currentStep < steps.length - 1
      ) {
        e.preventDefault();
        nextStep();
      }

      // Previous step: Left Arrow
      if (e.key === "ArrowLeft" && currentStep > 0) {
        e.preventDefault();
        prevStep();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [authModalOpen, currentStep, nextStep, prevStep]);

  const handleCloseModal = () => {
    setAuthModalOpen(false);
  };

  if (!CurrentStepComponent) {
    return <div>步驟不存在</div>;
  }

  return (
    <div className="relative mx-auto max-w-2xl">
      <AuthModal
        onAuthenticated={() => setAuthModalOpen(false)}
        onClose={handleCloseModal}
        open={authModalOpen}
      />

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-gray-500 text-sm">
          <span>
            步驟 {currentStep + 1} / {steps.length}
          </span>
          <span>{steps[currentStep]?.title}</span>
        </div>

        <div className="h-fit w-full rounded-full border-2 border-gray-200/30 bg-gray-400/30">
          <div
            className="h-2 rounded-full bg-black transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current step content */}
      <div className="relative min-h-[500px] rounded-lg bg-white p-8 shadow-lg">
        <CurrentStepComponent />
      </div>

      {/* Navigation buttons */}
      <div className="mt-6 flex justify-between">
        <Button
          className="px-6"
          disabled={currentStep === 0 || authModalOpen}
          onClick={prevStep}
          variant="outline"
        >
          上一步
        </Button>

        {currentStep < steps.length - 1 && (
          <Button className="px-6" disabled={authModalOpen} onClick={nextStep}>
            下一步
          </Button>
        )}
      </div>
    </div>
  );
}
