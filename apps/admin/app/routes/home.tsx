import type { Route } from "./+types/home";
import { Button } from "@blackliving/ui";
import { useEffect } from "react";
import { useNavigate } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Black Living Admin" },
    { name: "description", content: "Welcome to Black Living Admin Dashboard!" },
  ];
}

export default function Home() {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate("/dashboard", { replace: true });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">黑哥家居管理後台</h1>
        <p className="text-muted-foreground">正在導向儀表板...</p>
      </div>
    </div>
  );
}
