import { Outlet } from 'react-router';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@blackliving/ui';
import { BlackLivingAppSidebar } from '../components/BlackLivingAppSidebar';
import { BreadcrumbComponent } from '../components/BreadcrumbComponent';



export default function DashboardLayout() {
  return (
      <SidebarProvider style={{"--sidebar-width": "12rem"} as React.CSSProperties}>
        <BlackLivingAppSidebar variant="inset" side="left"/>
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
  );
}