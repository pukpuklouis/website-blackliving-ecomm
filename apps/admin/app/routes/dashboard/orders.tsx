import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Badge,
  Textarea,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@blackliving/ui';
// Tree-shakable Lucide imports
import Search from '@lucide/react/search';
import Eye from '@lucide/react/eye';
import Edit from '@lucide/react/edit';
import Package from '@lucide/react/package';
import Truck from '@lucide/react/truck';
import CheckCircle from '@lucide/react/check-circle';
import XCircle from '@lucide/react/x-circle';
import Clock from '@lucide/react/clock';
import Filter from '@lucide/react/filter';
import DollarSign from '@lucide/react/dollar-sign';
import FileImage from '@lucide/react/file-image';
import {
  useReactTable,
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { toast } from 'sonner';

interface OrderItem {
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  name: string;
  size?: string;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

interface ShippingAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  postalCode: string;
}

interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  customerInfo: CustomerInfo;
  items: OrderItem[];
  subtotalAmount: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: 'bank_transfer' | 'credit_card' | 'cash_on_delivery';
  status: 'pending_payment' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  paymentProof?: string;
  paymentVerifiedAt?: Date;
  paymentVerifiedBy?: string;
  notes: string;
  adminNotes: string;
  shippingAddress?: ShippingAddress;
  trackingNumber?: string;
  shippingCompany?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const statusLabels = {
  pending_payment: '待付款',
  paid: '已付款',
  processing: '處理中',
  shipped: '配送中',
  delivered: '已完成',
  cancelled: '已取消',
};

const statusColors = {
  pending_payment: 'bg-yellow-500',
  paid: 'bg-blue-500',
  processing: 'bg-purple-500',
  shipped: 'bg-orange-500',
  delivered: 'bg-green-500',
  cancelled: 'bg-gray-500',
};

const paymentStatusLabels = {
  unpaid: '未付款',
  paid: '已付款',
  refunded: '已退款',
};

const paymentMethodLabels = {
  bank_transfer: '銀行轉帳',
  credit_card: '信用卡',
  cash_on_delivery: '貨到付款',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Order>>({});

  const columnHelper = createColumnHelper<Order>();

  const columns = [
    columnHelper.accessor('orderNumber', {
      header: '訂單編號',
      cell: info => <div className="font-mono text-sm font-medium">{info.getValue()}</div>,
    }),
    columnHelper.accessor('customerInfo', {
      header: '客戶資訊',
      cell: info => {
        const customer = info.getValue();
        return (
          <div>
            <div className="font-medium">{customer.name}</div>
            <div className="text-sm text-gray-600">{customer.email}</div>
            <div className="text-sm text-gray-600">{customer.phone}</div>
          </div>
        );
      },
    }),
    columnHelper.accessor('totalAmount', {
      header: '總金額',
      cell: info => <div className="font-medium">NT${info.getValue().toLocaleString()}</div>,
    }),
    columnHelper.accessor('paymentMethod', {
      header: '付款方式',
      cell: info => <Badge variant="outline">{paymentMethodLabels[info.getValue()]}</Badge>,
    }),
    columnHelper.accessor('status', {
      header: '訂單狀態',
      cell: info => (
        <Badge className={`text-white ${statusColors[info.getValue()]}`}>
          {statusLabels[info.getValue()]}
        </Badge>
      ),
      filterFn: 'equals',
    }),
    columnHelper.accessor('paymentStatus', {
      header: '付款狀態',
      cell: info => (
        <Badge
          variant={info.getValue() === 'paid' ? 'default' : 'secondary'}
          className={
            info.getValue() === 'paid' ? 'bg-green-500 text-white hover:bg-green-500/90' : ''
          }
        >
          {paymentStatusLabels[info.getValue()]}
        </Badge>
      ),
    }),
    columnHelper.accessor('createdAt', {
      header: '建立時間',
      cell: info =>
        new Date(info.getValue()).toLocaleDateString('zh-TW', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
    }),
    columnHelper.display({
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewDetails(row.original)}
            title="查看詳情"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(row.original)}
            title="編輯訂單"
          >
            <Edit className="h-4 w-4" />
          </Button>
          {row.original.status === 'paid' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleUpdateStatus(row.original.id, 'processing')}
              title="標記為處理中"
            >
              <Package className="h-4 w-4" />
            </Button>
          )}
          {row.original.status === 'processing' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleUpdateStatus(row.original.id, 'shipped')}
              title="標記為已出貨"
            >
              <Truck className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: orders,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8787/api/orders');
      if (response.ok) {
        const result = await response.json();
        setOrders(result.success ? result.data.orders : []);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast.error('載入訂單失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailDialogOpen(true);
  };

  const handleEdit = (order: Order) => {
    setSelectedOrder(order);
    setEditFormData(order);
    setIsEditDialogOpen(true);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const response = await fetch(`http://localhost:8787/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setOrders(prev =>
          prev.map(order =>
            order.id === orderId ? { ...order, status: newStatus, updatedAt: new Date() } : order
          )
        );
        toast.success('訂單狀態更新成功');
      } else {
        throw new Error('Failed to update order status');
      }
    } catch (error) {
      console.error('Update status failed:', error);
      toast.error('更新訂單狀態失敗');
    }
  };

  const handleConfirmPayment = async (orderId: string) => {
    try {
      const response = await fetch(`http://localhost:8787/api/orders/${orderId}/confirm-payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          paymentStatus: 'paid',
          status: 'paid',
          paymentVerifiedAt: new Date(),
          paymentVerifiedBy: 'admin', // This should be from auth context
        }),
      });

      if (response.ok) {
        await loadOrders(); // Reload to get updated data
        toast.success('付款確認成功');
      } else {
        throw new Error('Failed to confirm payment');
      }
    } catch (error) {
      console.error('Confirm payment failed:', error);
      toast.error('確認付款失敗');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">訂單管理</h1>
        <p className="text-gray-600 mt-2">處理客戶訂單與出貨狀態</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">待付款</p>
                <p className="text-2xl font-bold">
                  {orders.filter(o => o.status === 'pending_payment').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">已付款</p>
                <p className="text-2xl font-bold">
                  {orders.filter(o => o.status === 'paid').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Truck className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">配送中</p>
                <p className="text-2xl font-bold">
                  {orders.filter(o => o.status === 'shipped').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">已完成</p>
                <p className="text-2xl font-bold">
                  {orders.filter(o => o.status === 'delivered').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            篩選與搜尋
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="搜尋訂單編號、客戶姓名、電話..."
                  value={globalFilter}
                  onChange={e => setGlobalFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={(table.getColumn('status')?.getFilterValue() as string) ?? ''}
              onValueChange={value =>
                table.getColumn('status')?.setFilterValue(value === 'all' ? '' : value)
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="篩選狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部狀態</SelectItem>
                <SelectItem value="pending_payment">待付款</SelectItem>
                <SelectItem value="paid">已付款</SelectItem>
                <SelectItem value="processing">處理中</SelectItem>
                <SelectItem value="shipped">配送中</SelectItem>
                <SelectItem value="delivered">已完成</SelectItem>
                <SelectItem value="cancelled">已取消</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>訂單列表</CardTitle>
          <CardDescription>共 {table.getFilteredRowModel().rows.length} 筆訂單</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id} className="border-b bg-gray-50/50">
                    {headerGroup.headers.map(header => (
                      <th key={header.id} className="px-4 py-3 text-left font-medium text-gray-900">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="border-b hover:bg-gray-50/50">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-2 py-4">
            <div className="text-sm text-gray-700">
              顯示{' '}
              {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} 到{' '}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}{' '}
              項，共 {table.getFilteredRowModel().rows.length} 項
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                上一頁
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                下一頁
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>訂單詳情 - {selectedOrder?.orderNumber}</DialogTitle>
            <DialogDescription>查看完整的訂單資訊與處理狀態</DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">訂單資訊</TabsTrigger>
                <TabsTrigger value="payment">付款資訊</TabsTrigger>
                <TabsTrigger value="shipping">物流資訊</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">客戶資訊</h4>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="text-gray-600">姓名：</span>
                        {selectedOrder.customerInfo.name}
                      </p>
                      <p>
                        <span className="text-gray-600">電話：</span>
                        {selectedOrder.customerInfo.phone}
                      </p>
                      <p>
                        <span className="text-gray-600">Email：</span>
                        {selectedOrder.customerInfo.email}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">訂單狀態</h4>
                    <div className="space-y-2">
                      <Badge className={`text-white ${statusColors[selectedOrder.status]}`}>
                        {statusLabels[selectedOrder.status]}
                      </Badge>
                      <Badge
                        variant={selectedOrder.paymentStatus === 'paid' ? 'default' : 'secondary'}
                        className={
                          selectedOrder.paymentStatus === 'paid' ? 'bg-green-500 text-white' : ''
                        }
                      >
                        {paymentStatusLabels[selectedOrder.paymentStatus]}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">訂單商品</h4>
                  <div className="border rounded-lg">
                    {selectedOrder.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 border-b last:border-b-0"
                      >
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.size && <p className="text-sm text-gray-600">規格：{item.size}</p>}
                          <p className="text-sm text-gray-600">數量：{item.quantity}</p>
                        </div>
                        <p className="font-medium">
                          NT${(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    ))}
                    <div className="p-3 bg-gray-50">
                      <div className="flex justify-between text-sm">
                        <span>小計</span>
                        <span>NT${selectedOrder.subtotalAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>運費</span>
                        <span>NT${selectedOrder.shippingFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-medium text-lg border-t pt-2 mt-2">
                        <span>總計</span>
                        <span>NT${selectedOrder.totalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div>
                    <h4 className="font-medium mb-2">客戶備註</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {selectedOrder.notes}
                    </p>
                  </div>
                )}

                {selectedOrder.adminNotes && (
                  <div>
                    <h4 className="font-medium mb-2">管理員備註</h4>
                    <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                      {selectedOrder.adminNotes}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="payment" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">付款方式</h4>
                    <Badge variant="outline">
                      {paymentMethodLabels[selectedOrder.paymentMethod]}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">付款狀態</h4>
                    <Badge
                      variant={selectedOrder.paymentStatus === 'paid' ? 'default' : 'secondary'}
                      className={
                        selectedOrder.paymentStatus === 'paid' ? 'bg-green-500 text-white' : ''
                      }
                    >
                      {paymentStatusLabels[selectedOrder.paymentStatus]}
                    </Badge>
                  </div>
                </div>

                {selectedOrder.paymentProof && (
                  <div>
                    <h4 className="font-medium mb-2">付款證明</h4>
                    <div className="border rounded-lg p-4">
                      <img
                        src={selectedOrder.paymentProof}
                        alt="付款證明"
                        className="max-w-full h-auto max-h-64 rounded"
                      />
                    </div>
                  </div>
                )}

                {selectedOrder.paymentStatus === 'unpaid' &&
                  selectedOrder.paymentMethod === 'bank_transfer' && (
                    <div className="flex justify-end">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button>確認收到付款</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>確認付款</AlertDialogTitle>
                            <AlertDialogDescription>
                              確定已收到客戶的銀行轉帳付款嗎？此操作會將訂單狀態更新為「已付款」。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleConfirmPayment(selectedOrder.id)}
                            >
                              確認付款
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
              </TabsContent>

              <TabsContent value="shipping" className="space-y-4">
                {selectedOrder.shippingAddress && (
                  <div>
                    <h4 className="font-medium mb-2">配送地址</h4>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm">
                      <p>
                        <span className="text-gray-600">收件人：</span>
                        {selectedOrder.shippingAddress.name}
                      </p>
                      <p>
                        <span className="text-gray-600">電話：</span>
                        {selectedOrder.shippingAddress.phone}
                      </p>
                      <p>
                        <span className="text-gray-600">地址：</span>
                        {selectedOrder.shippingAddress.postalCode}{' '}
                        {selectedOrder.shippingAddress.city}
                        {selectedOrder.shippingAddress.district}{' '}
                        {selectedOrder.shippingAddress.address}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">物流公司</h4>
                    <p className="text-sm">{selectedOrder.shippingCompany || '尚未設定'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">追蹤號碼</h4>
                    <p className="text-sm font-mono">
                      {selectedOrder.trackingNumber || '尚未設定'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">出貨時間</h4>
                    <p className="text-sm">
                      {selectedOrder.shippedAt
                        ? new Date(selectedOrder.shippedAt).toLocaleString('zh-TW')
                        : '尚未出貨'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">送達時間</h4>
                    <p className="text-sm">
                      {selectedOrder.deliveredAt
                        ? new Date(selectedOrder.deliveredAt).toLocaleString('zh-TW')
                        : '尚未送達'}
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
