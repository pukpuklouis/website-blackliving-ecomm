import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Black Living Admin" },
    {
      name: "description",
      content: "Welcome to Black Living Admin Dashboard!",
    },
  ];
}

export default function Home() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    }
  }, [user, loading, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 font-bold text-2xl">黑哥家居管理後台</h1>
        <p className="text-muted-foreground">
          {loading ? "正在載入..." : "正在導向..."}
        </p>
      </div>
    </div>
  );
}
