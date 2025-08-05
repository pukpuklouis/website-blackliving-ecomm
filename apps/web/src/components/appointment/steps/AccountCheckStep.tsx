import React, { useState } from 'react';
import { useAppointmentStore } from '../../../stores/appointmentStore';
import { Button } from '@blackliving/ui';

export default function AccountCheckStep() {
  const { appointmentData, updateAppointmentData, nextStep } = useAppointmentStore();
  const [email, setEmail] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<'none' | 'exists' | 'new'>('none');

  const checkAccount = async () => {
    if (!email.trim()) return;

    setIsChecking(true);

    try {
      // API call to check if email exists
      const response = await fetch('/api/user/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const result = await response.json();
        const exists = result.data.exists;
        setCheckResult(exists ? 'exists' : 'new');
        updateAppointmentData({
          email,
          hasAccount: exists,
          createAccount: !exists,
        });
      }
    } catch (error) {
      // For demo, assume new account
      setCheckResult('new');
      updateAppointmentData({
        email,
        hasAccount: false,
        createAccount: true,
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleContinue = () => {
    if (checkResult === 'exists') {
      // User has account, proceed to store selection
      nextStep();
    } else if (checkResult === 'new') {
      // User needs to create account, continue to store selection
      // (account creation will happen after appointment booking)
      nextStep();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (checkResult === 'none' && email.trim()) {
        checkAccount();
      } else if (checkResult !== 'none') {
        handleContinue();
      }
    }
  };

  return (
    <div className="text-center">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">歡迎預約席夢思黑標試躺</h2>
        <p className="text-lg text-gray-600">請先輸入您的 Email 地址，我們會檢查您是否已有帳戶</p>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        {checkResult === 'none' && (
          <>
            <div>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="請輸入您的 Email 地址"
                className="w-full px-4 py-3 text-lg border-b-2 border-gray-300 focus:border-black focus:outline-none bg-transparent"
                autoFocus
              />
            </div>

            <Button
              onClick={checkAccount}
              disabled={!email.trim() || isChecking}
              className="w-full py-3 text-lg"
            >
              {isChecking ? '檢查中...' : '檢查帳戶'}
            </Button>
          </>
        )}

        {checkResult === 'exists' && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">太好了！我們找到了您的帳戶</p>
                  <p className="text-sm text-green-700 mt-1">{email}</p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleContinue}
              onKeyPress={handleKeyPress}
              className="w-full py-3 text-lg"
              autoFocus
            >
              繼續預約
            </Button>
          </div>
        )}

        {checkResult === 'new' && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-800">歡迎新朋友！</p>
                  <p className="text-sm text-blue-700 mt-1">
                    我們會在預約完成後為您建立帳戶：{email}
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleContinue}
              onKeyPress={handleKeyPress}
              className="w-full py-3 text-lg"
              autoFocus
            >
              開始預約
            </Button>
          </div>
        )}
      </div>

      <div className="mt-8 text-sm text-gray-500">
        <p>預約流程：帳戶檢查 → 選擇門市 → 選擇產品 → 填寫資訊 → 確認時間</p>
      </div>
    </div>
  );
}
