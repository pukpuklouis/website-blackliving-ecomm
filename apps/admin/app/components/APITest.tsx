import { useState, useEffect } from 'react';

interface APITestProps {
  apiUrl?: string;
}

export default function APITest({ apiUrl = 'http://localhost:8787' }: APITestProps) {
  const [apiStatus, setApiStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [sessionData, setSessionData] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    testAPIConnection();
  }, []);

  const testAPIConnection = async () => {
    try {
      setApiStatus('loading');
      
      // Test basic API connection
      const healthResponse = await fetch(`${apiUrl}/`);
      if (!healthResponse.ok) {
        throw new Error(`API health check failed: ${healthResponse.status}`);
      }
      const healthData = await healthResponse.json();
      console.log('API Health:', healthData);

      // Test auth session endpoint
      const sessionResponse = await fetch(`${apiUrl}/api/auth/get-session`, {
        credentials: 'include',
      });
      if (!sessionResponse.ok) {
        throw new Error(`Session check failed: ${sessionResponse.status}`);
      }
      const sessionData = await sessionResponse.json();
      console.log('Session Data:', sessionData);
      
      setSessionData(sessionData);
      setApiStatus('success');
    } catch (err) {
      console.error('API Test Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setApiStatus('error');
    }
  };

  return (
    <div className="p-6 border rounded-lg bg-white shadow-sm">
      <h3 className="text-xl font-semibold mb-4">API Connection Test</h3>
      
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="font-medium text-gray-700 min-w-24">Status:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            apiStatus === 'loading' ? 'bg-yellow-100 text-yellow-800' :
            apiStatus === 'success' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {apiStatus === 'loading' ? 'Testing...' :
             apiStatus === 'success' ? 'Connected ✓' :
             'Failed ✗'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-medium text-gray-700 min-w-24">API URL:</span>
          <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono">{apiUrl}</code>
        </div>

        <div className="flex items-start gap-3">
          <span className="font-medium text-gray-700 min-w-24">Session:</span>
          <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono flex-1">
            {sessionData === null ? 'No active session' : JSON.stringify(sessionData, null, 2)}
          </code>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <div className="text-red-800 text-sm">
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={testAPIConnection}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={apiStatus === 'loading'}
          >
            {apiStatus === 'loading' ? 'Testing...' : 'Test Again'}
          </button>
        </div>
      </div>
    </div>
  );
}