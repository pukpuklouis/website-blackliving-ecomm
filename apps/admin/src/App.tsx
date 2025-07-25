import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@blackliving/ui/components/ui/toaster';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import OrdersPage from './pages/OrdersPage';
import AppointmentsPage from './pages/AppointmentsPage';
import PostManagement from './pages/PostManagement';
import BlogComposer from './pages/BlogComposer';

import Layout from './components/layout/Layout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="posts" element={<PostManagement />} />
            <Route path="posts/new" element={<BlogComposer />} />
            <Route path="posts/edit/:id" element={<BlogComposer />} />
          </Route>
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;