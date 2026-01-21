import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@blackliving/ui";
import { Fragment } from "react";
import { Link, useLocation } from "react-router";

const routeNames: Record<string, string> = {
  "/dashboard": "主控台",
  "/dashboard/products": "產品管理",
  "/dashboard/orders": "訂單管理",
  "/dashboard/posts": "文章管理",
  "/dashboard/pages": "頁面管理",
  "/dashboard/pages/new": "新增頁面",
  "/dashboard/blog": "部落格編輯",
  "/dashboard/blog-composer": "編輯文章",
  "/dashboard/appointments": "預約管理",
  "/dashboard/customers": "客戶管理",
  "/dashboard/analytics": "分析報表",
  "/dashboard/settings": "系統設定",
  "/dashboard/account-settings": "帳戶設定",
  "/dashboard/products/new": "新增產品",
};

// Dynamic route patterns - matches routes with :id or other params
const dynamicRoutes: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /^\/dashboard\/pages\/[^/]+\/edit$/, name: "編輯" },
  { pattern: /^\/dashboard\/products\/[^/]+\/edit$/, name: "編輯產品" },
  { pattern: /^\/dashboard\/posts\/[^/]+\/edit$/, name: "編輯文章" },
];

function getRouteName(path: string): string {
  // First check exact matches
  if (routeNames[path]) {
    return routeNames[path];
  }

  // Then check dynamic patterns
  for (const { pattern, name } of dynamicRoutes) {
    if (pattern.test(path)) {
      return name;
    }
  }

  // Default to the last segment
  return path.split("/").pop() || path;
}

export function BreadcrumbComponent() {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = "/" + pathSegments.slice(0, index + 1).join("/");
    return {
      path,
      name: getRouteName(path),
      isLast: index === pathSegments.length - 1,
    };
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => (
          <Fragment key={crumb.path}>
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={crumb.path}>{crumb.name}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!crumb.isLast && <BreadcrumbSeparator />}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
