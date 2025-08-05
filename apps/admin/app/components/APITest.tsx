import { useState } from 'react';

interface APIResponse {
  status: number;
  data: any;
  error?: string;
}

export default function APITest() {
  const [response, setResponse] = useState<APIResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (endpoint: string, name: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api${endpoint}`);
      const data = await res.json();
      setResponse({
        status: res.status,
        data: data,
      });
    } catch (error) {
      setResponse({
        status: 0,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => testEndpoint('/health', 'Health Check')}
          disabled={loading}
          className="p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          Test Health Endpoint
        </button>
        <button
          onClick={() => testEndpoint('/products', 'Products API')}
          disabled={loading}
          className="p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
        >
          Test Products API
        </button>
        <button
          onClick={() => testEndpoint('/auth/session', 'Auth Session')}
          disabled={loading}
          className="p-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
        >
          Test Auth Session
        </button>
        <button
          onClick={() => testEndpoint('/categories', 'Categories API')}
          disabled={loading}
          className="p-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
        >
          Test Categories API
        </button>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          <span className="ml-2">Testing API...</span>
        </div>
      )}

      {response && !loading && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">API Response:</h3>
          <div className="bg-gray-100 p-4 rounded-lg">
            <div className="mb-2">
              <span className="font-medium">Status: </span>
              <span className={`${
                response.status === 200 ? 'text-green-600' : 'text-red-600'
              }`}>
                {response.status}
              </span>
            </div>
            {response.error && (
              <div className="mb-2">
                <span className="font-medium text-red-600">Error: </span>
                <span className="text-red-600">{response.error}</span>
              </div>
            )}
            <div>
              <span className="font-medium">Response: </span>
              <pre className="mt-2 bg-white p-3 rounded border overflow-auto max-h-60">
                {JSON.stringify(response.data, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}