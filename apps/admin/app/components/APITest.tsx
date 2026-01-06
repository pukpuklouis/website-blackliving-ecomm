import { useState } from "react";

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
        data,
      });
    } catch (error) {
      setResponse({
        status: 0,
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <button
          className="rounded-lg bg-blue-500 p-4 text-white hover:bg-blue-600 disabled:opacity-50"
          disabled={loading}
          onClick={() => testEndpoint("/health", "Health Check")}
        >
          Test Health Endpoint
        </button>
        <button
          className="rounded-lg bg-green-500 p-4 text-white hover:bg-green-600 disabled:opacity-50"
          disabled={loading}
          onClick={() => testEndpoint("/products", "Products API")}
        >
          Test Products API
        </button>
        <button
          className="rounded-lg bg-purple-500 p-4 text-white hover:bg-purple-600 disabled:opacity-50"
          disabled={loading}
          onClick={() => testEndpoint("/auth/session", "Auth Session")}
        >
          Test Auth Session
        </button>
        <button
          className="rounded-lg bg-orange-500 p-4 text-white hover:bg-orange-600 disabled:opacity-50"
          disabled={loading}
          onClick={() => testEndpoint("/categories", "Categories API")}
        >
          Test Categories API
        </button>
      </div>

      {loading && (
        <div className="py-4 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-gray-900 border-b-2" />
          <span className="ml-2">Testing API...</span>
        </div>
      )}

      {response && !loading && (
        <div className="mt-6">
          <h3 className="mb-2 font-semibold text-lg">API Response:</h3>
          <div className="rounded-lg bg-gray-100 p-4">
            <div className="mb-2">
              <span className="font-medium">Status: </span>
              <span
                className={`${response.status === 200 ? "text-green-600" : "text-red-600"}`}
              >
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
              <pre className="mt-2 max-h-60 overflow-auto rounded border bg-white p-3">
                {JSON.stringify(response.data, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
