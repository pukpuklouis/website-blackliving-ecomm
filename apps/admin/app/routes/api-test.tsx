import type { Route } from "./+types/api-test";
import APITest from "../components/APITest";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "API Test - Black Living Admin" },
    { name: "description", content: "Test API connection from admin app" },
  ];
}

export default function APITestRoute() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">API Connection Test</h1>
        <APITest />
      </div>
    </div>
  );
}