import { useEffect, useState } from 'react';
import { Button } from '@blackliving/ui';
import { useAppointmentStore } from '../../stores/appointmentStore';
import { useAuthStore } from '../../stores/authStore';
import StoreSelectionStep from './steps/StoreSelectionStep';
import ProductSelectionStep from './steps/ProductSelectionStep';
import PersonalInfoStep from './steps/PersonalInfoStep';
import DateTimeStep from './steps/DateTimeStep';
import ReviewStep from './steps/ReviewStep';
import MagicLinkModal from '../auth/MagicLinkModal';

const steps = [
  { id: 'store', title: '選擇門市', component: StoreSelectionStep },
  { id: 'product', title: '選擇產品', component: ProductSelectionStep },
  { id: 'personal', title: '個人資訊', component: PersonalInfoStep },
  { id: 'datetime', title: '預約時間', component: DateTimeStep },
  { id: 'review', title: '確認預約', component: ReviewStep },
];

export default function MultiStepAppointmentForm() {
  const { currentStep, nextStep, prevStep } = useAppointmentStore();
  const { accessToken, accessTokenExpiresAt, ensureFreshAccessToken } = useAuthStore();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const CurrentStepComponent = steps[currentStep]?.component;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const token = await ensureFreshAccessToken();
        if (cancelled) return;
        if (!token) {
          setAuthModalOpen(true);
        }
      } finally {
        if (!cancelled) {
          setCheckingSession(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ensureFreshAccessToken]);

  useEffect(() => {
    if (checkingSession) return;
    const hasValidToken = accessToken && accessTokenExpiresAt && accessTokenExpiresAt > Date.now();
    setAuthModalOpen(!hasValidToken);
  }, [accessToken, accessTokenExpiresAt, checkingSession]);

  useEffect(() => {
    const handler = () => setAuthModalOpen(true);
    window.addEventListener('reservation-auth-required', handler);
    return () => window.removeEventListener('reservation-auth-required', handler);
  }, []);

  if (!CurrentStepComponent) {
    return <div>步驟不存在</div>;
  }

  const handleCloseModal = () => {
    const hasValidToken = accessToken && accessTokenExpiresAt && accessTokenExpiresAt > Date.now();
    if (!hasValidToken) {
      setAuthModalOpen(true);
    } else {
      setAuthModalOpen(false);
    }
  };

  return (
    <div className="relative mx-auto max-w-2xl">
      <MagicLinkModal open={authModalOpen} onClose={handleCloseModal} onAuthenticated={() => setAuthModalOpen(false)} />

      {authModalOpen && (
        <div className="pointer-events-none absolute inset-0 z-40 rounded-2xl bg-white/60 backdrop-blur-sm" aria-hidden />
      )}

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-sm text-gray-500">
          <span>
            步驟 {currentStep + 1} / {steps.length}
          </span>
          <span>{steps[currentStep]?.title}</span>
        </div>

        <div className="h-2 w-full rounded-full bg-gray-200">
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
        <Button variant="outline" onClick={prevStep} disabled={currentStep === 0 || authModalOpen} className="px-6">
          上一步
        </Button>

        <div className="self-center text-sm text-gray-500">按 Enter 繼續</div>

        {currentStep < steps.length - 1 && (
          <Button onClick={nextStep} disabled={authModalOpen} className="px-6">
            下一步
          </Button>
        )}
      </div>
    </div>
  );
}
