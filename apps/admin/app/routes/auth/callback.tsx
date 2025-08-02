import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { checkSession } from '@blackliving/auth/client';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasProcessed = useRef(false);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      if (hasProcessed.current) {
        return;
      }
      hasProcessed.current = true;

      const error = searchParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        navigate('/login?error=' + encodeURIComponent(error));
        return;
      }

      try {
        // Check if we have a valid session after OAuth
        const sessionData = await checkSession();
        
        if (sessionData.user && sessionData.user.role === 'admin') {
          // Clean up URL
          window.history.replaceState({}, '', '/auth/callback');
          // Redirect to dashboard
          navigate('/dashboard', { replace: true });
        } else {
          // Try again after a short delay in case session isn't ready
          setTimeout(async () => {
            try {
              const retrySessionData = await checkSession();
              if (retrySessionData.user && retrySessionData.user.role === 'admin') {
                navigate('/dashboard', { replace: true });
              } else {
                navigate('/login?error=unauthorized');
              }
            } catch (retryError) {
              console.error('Session retry failed:', retryError);
              navigate('/login?error=session_failed');
            }
          }, 1000);
        }
        
      } catch (err) {
        console.error('OAuth callback error:', err);
        navigate('/login?error=auth_check_failed');
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            登入中...
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            正在完成 Google 登入，請稍候...
          </p>
          <div className="mt-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
