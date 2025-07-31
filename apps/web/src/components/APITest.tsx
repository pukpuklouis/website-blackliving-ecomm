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
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-4">API Connection Test</h3>
      
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="font-medium">API Status:</span>
          <span className={`px-2 py-1 rounded text-sm ${
            apiStatus === 'loading' ? 'bg-yellow-100 text-yellow-800' :
            apiStatus === 'success' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {apiStatus === 'loading' ? 'Testing...' :
             apiStatus === 'success' ? 'Connected' :
             'Failed'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-medium">API URL:</span>
          <code className="bg-gray-100 px-2 py-1 rounded text-sm">{apiUrl}</code>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-medium">Session:</span>
          <code className="bg-gray-100 px-2 py-1 rounded text-sm">
            {sessionData === null ? 'No session' : JSON.stringify(sessionData)}
          </code>
        </div>

        {error && (
          <div className="text-red-600 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        <button
          onClick={testAPIConnection}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={apiStatus === 'loading'}
        >
          {apiStatus === 'loading' ? 'Testing...' : 'Test Again'}
        </button>
      </div>
    </div>
  );
}