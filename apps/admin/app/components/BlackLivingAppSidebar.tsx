import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@blackliving/ui";
import BarChart3 from "@lucide/react/bar-chart-3";
import Briefcase from "@lucide/react/briefcase";
import Calendar from "@lucide/react/calendar";
import FileText from "@lucide/react/file-text";
// Tree-shakable Lucide imports
import Home from "@lucide/react/home";
import LayoutTemplate from "@lucide/react/layout-template";
import Package from "@lucide/react/package";
import Settings from "@lucide/react/settings";
import ShoppingCart from "@lucide/react/shopping-cart";
import Users from "@lucide/react/users";
import { AdminNavMain } from "./AdminNavMain";
import { AdminNavSecondary } from "./AdminNavSecondary";
import { AdminNavUser } from "./AdminNavUser";

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
      title: "頁面管理",
      url: "/dashboard/pages",
      icon: LayoutTemplate,
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
    {
      title: "異業合作",
      url: "/dashboard/business-cooperation",
      icon: Briefcase,
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
        <div className="flex items-center gap-2 px-2 py-2">
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
        <AdminNavSecondary className="mt-auto" items={data.navSecondary} />
      </SidebarContent>
      <SidebarFooter>
        <AdminNavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
