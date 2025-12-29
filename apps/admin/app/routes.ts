import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("api-test", "routes/api-test.tsx"),
  route("auth/callback", "routes/auth/callback.tsx"),
  route("dashboard", "routes/dashboard.tsx", [
    index("routes/dashboard/index.tsx"),
    route("products", "routes/dashboard/products.tsx"),
    route("products/new", "routes/dashboard/products.new.tsx"),
    route(
      "products/:productId/edit",
      "routes/dashboard/products.[productId].edit.tsx"
    ),
    route("orders", "routes/dashboard/orders.tsx"),
    route("posts", "routes/dashboard/posts.tsx"),
    route("blog-composer", "routes/dashboard/blog-composer.tsx"),
    route("editor-playground", "routes/dashboard/editor-playground.tsx"),
    route("appointments", "routes/dashboard/appointments.tsx"),
    route("customers", "routes/dashboard/customers.tsx"),
    route("analytics", "routes/dashboard/analytics.tsx"),
    route("settings", "routes/dashboard/settings.tsx"),
    route("business-cooperation", "routes/dashboard/business-cooperation.tsx"),
    route("pages", "routes/dashboard/pages.tsx", [
      index("routes/dashboard/pages._index.tsx"),
      route("new", "routes/dashboard/pages.new.tsx"),
      route(":pageId/edit", "routes/dashboard/pages.[pageId].edit.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
