import { Button } from "@blackliving/ui";
import { secureSignOut } from "@blackliving/auth";
import { Calendar, LogOut, Package, User } from "lucide-react";

// Simple utility function for combining classnames
const cn = (...classes: (string | undefined | null | false)[]) =>
  classes.filter(Boolean).join(" ");

type AccountNavProps = {
  currentPage: "profile" | "orders" | "appointments";
  className?: string;
};

const navItems = [
  {
    href: "/account/profile",
    label: "個人資料",
    icon: User,
    page: "profile" as const,
  },
  {
    href: "/account/orders",
    label: "訂單記錄",
    icon: Package,
    page: "orders" as const,
  },
  {
    href: "/account/appointments",
    label: "預約記錄",
    icon: Calendar,
    page: "appointments" as const,
  },
];

export default function AccountNav({
  currentPage,
  className,
}: AccountNavProps) {
  const handleLogout = async () => {
    await secureSignOut();
    window.location.href = "/login";
  };

  return (
    <div className={cn("md:col-span-1", className)}>
      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.page;

          return (
            <Button
              asChild
              className={cn(
                "h-auto w-full justify-start gap-3 p-4",
                isActive
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              key={item.page}
              variant={isActive ? "default" : "ghost"}
            >
              <a href={item.href}>
                <Icon className="h-4 w-4" />
                {item.label}
              </a>
            </Button>
          );
        })}

        <div className="my-4">
          <div className="border-border border-t" />
        </div>

        <Button
          className="h-auto w-full justify-start gap-3 p-4 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleLogout}
          variant="ghost"
        >
          <LogOut className="h-4 w-4" />
          登出
        </Button>
      </nav>
    </div>
  );
}
