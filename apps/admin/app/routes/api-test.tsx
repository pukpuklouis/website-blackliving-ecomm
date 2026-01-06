import APITest from "../components/APITest";
import type { Route } from "./+types/api-test";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "API Test - Black Living Admin" },
    { name: "description", content: "Test API connection from admin app" },
  ];
}

export default function APITestRoute() {
  return (
    <div className="p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 font-bold text-3xl text-gray-900">
          API Connection Test
        </h1>
        <APITest />
      </div>
    </div>
  );
}
