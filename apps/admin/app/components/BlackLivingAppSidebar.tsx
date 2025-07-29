import { Sidebar, SidebarContent, SidebarHeader, SidebarRail } from '@blackliving/ui';
import { AdminNavMain } from './AdminNavMain';
import { AdminNavSecondary } from './AdminNavSecondary';
import { 
  Home, 
  Package, 
  ShoppingCart, 
  FileText, 
  PenTool,
  Settings,
  Calendar,
  BarChart3,
  Users
} from 'lucide-react';

const data = {
  user: {
    name: "黑哥家居管理員",
    email: "admin@blackliving.com.tw",
    avatar: "/avatars/admin.jpg",
  },
  navMain: [
    {
      title: "主控台",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "產品管理",
      url: "/dashboard/products",
      icon: Package,
    },
    {
      title: "訂單管理",
      url: "/dashboard/orders",
      icon: ShoppingCart,
    },
    {
      title: "文章管理",
      url: "/dashboard/posts",
      icon: FileText,
    },
    {
      title: "部落格編輯",
      url: "/dashboard/blog",
      icon: PenTool,
    },
    {
      title: "預約管理",
      url: "/dashboard/appointments",
      icon: Calendar,
    },
    {
      title: "客戶管理",
      url: "/dashboard/customers",
      icon: Users,
    },
    {
      title: "分析報表",
      url: "/dashboard/analytics",
      icon: BarChart3,
    },
  ],
  navSecondary: [
    {
      title: "系統設定",
      url: "/dashboard/settings",
      icon: Settings,
    },
  ],
};

export function BlackLivingAppSidebar({ ...props }) {
  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Home className="h-4 w-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">黑哥家居</span>
            <span className="truncate text-xs">管理後台</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <AdminNavMain items={data.navMain} />
        <AdminNavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
