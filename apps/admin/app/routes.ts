import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("api-test", "routes/api-test.tsx"),
  route("dashboard", "routes/dashboard.tsx", [
    index("routes/dashboard/index.tsx"),
    route("products", "routes/dashboard/products.tsx"),
    route("orders", "routes/dashboard/orders.tsx"),
    route("posts", "routes/dashboard/posts.tsx"),
    route("blog-composer", "routes/dashboard/blog-composer.tsx"),
    route("appointments", "routes/dashboard/appointments.tsx"),
    route("customers", "routes/dashboard/customers.tsx"),
    route("analytics", "routes/dashboard/analytics.tsx"),
    route("settings", "routes/dashboard/settings.tsx"),
  ]),
] satisfies RouteConfig;
