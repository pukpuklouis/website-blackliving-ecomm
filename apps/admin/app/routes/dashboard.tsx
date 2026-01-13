import { SidebarInset, SidebarProvider, SidebarTrigger } from "@blackliving/ui";
import { Outlet } from "react-router";
import { BlackLivingAppSidebar } from "../components/BlackLivingAppSidebar";
import { BreadcrumbComponent } from "../components/BreadcrumbComponent";
import { ProtectedRoute } from "../components/ProtectedRoute";
import type { Route } from "./+types/dashboard";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "黑哥居家 | 管理後台" },
    {
      name: "description",
      content: "黑哥居家管理後台",
    },
  ];
}

export default function DashboardLayout() {
  return (
    <ProtectedRoute>
      <SidebarProvider
        style={{ "--sidebar-width": "12rem" } as React.CSSProperties}
      >
        <BlackLivingAppSidebar side="left" variant="inset" />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <BreadcrumbComponent />
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
