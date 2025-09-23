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
  Switch,
} from '@blackliving/ui';
// Tree-shakable Lucide imports
import Search from '@lucide/react/search';
import Eye from '@lucide/react/eye';
import Edit from '@lucide/react/edit';
import Plus from '@lucide/react/plus';
import Tag from '@lucide/react/tag';
import TrendingUp from '@lucide/react/trending-up';
import ShoppingBag from '@lucide/react/shopping-bag';
import Calendar from '@lucide/react/calendar';
import Phone from '@lucide/react/phone';
import Mail from '@lucide/react/mail';
import MapPin from '@lucide/react/map-pin';
import Filter from '@lucide/react/filter';
import Star from '@lucide/react/star';
import Users from '@lucide/react/users';
import DollarSign from '@lucide/react/dollar-sign';
import Package from '@lucide/react/package';
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

interface CustomerAddress {
  city: string;
  district: string;
  street: string;
  postalCode: string;
}

interface CustomerTag {
  id: string;
  name: string;
  color: string;
  category: string;
}

interface CustomerProfile {
  id: string;
  customerNumber: string;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  birthday?: string;
  gender?: 'male' | 'female' | 'other';
  address?: CustomerAddress;
  shippingAddresses: CustomerAddress[];
  // Purchase Behavior
  totalSpent: number;
  orderCount: number;
  avgOrderValue: number;
  lastPurchaseAt?: Date;
  firstPurchaseAt?: Date;
  // Preferences & Segmentation
  favoriteCategories: string[];
  purchaseHistory: any[];
  segment: 'new' | 'regular' | 'vip' | 'inactive';
  lifetimeValue: number;
  churnRisk: 'low' | 'medium' | 'high';
  // Interaction
  lastContactAt?: Date;
  contactPreference: 'email' | 'phone' | 'sms';
  notes: string;
  source: string;
  tags: CustomerTag[];
  createdAt: Date;
  updatedAt: Date;
}

interface CustomerInteraction {
  id: string;
  type: string;
  title: string;
  description?: string;
  performedBy?: string;
  createdAt: Date;
}

const segmentLabels = {
  new: '新客戶',
  regular: '一般客戶',
  vip: 'VIP客戶',
  inactive: '非活躍客戶',
};

const segmentColors = {
  new: 'bg-blue-500',
  regular: 'bg-green-500',
  vip: 'bg-purple-500',
  inactive: 'bg-gray-500',
};

const churnRiskLabels = {
  low: '低風險',
  medium: '中風險',
  high: '高風險',
};

const churnRiskColors = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-red-500',
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [customerInteractions, setCustomerInteractions] = useState<CustomerInteraction[]>([]);

  const columnHelper = createColumnHelper<CustomerProfile>();

  const columns = [
    columnHelper.accessor('customerNumber', {
      header: '客戶編號',
      cell: info => <div className="font-mono text-sm font-medium">{info.getValue()}</div>,
    }),
    columnHelper.accessor('name', {
      header: '客戶資訊',
      cell: info => {
        const customer = info.row.original;
        return (
          <div>
            <div className="font-medium">{info.getValue()}</div>
            <div className="text-sm text-gray-600 flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {customer.email}
            </div>
            <div className="text-sm text-gray-600 flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {customer.phone}
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor('segment', {
      header: '客戶分級',
      cell: info => (
        <Badge className={`text-white ${segmentColors[info.getValue()]}`}>
          {segmentLabels[info.getValue()]}
        </Badge>
      ),
      filterFn: 'equals',
    }),
    columnHelper.accessor('tags', {
      header: '標籤',
      cell: info => {
        const tags = info.getValue();
        return (
          <div className="flex flex-wrap gap-1 max-w-32">
            {tags.slice(0, 2).map(tag => (
              <Badge
                key={tag.id}
                variant="outline"
                className="text-xs"
                style={{ borderColor: tag.color, color: tag.color }}
              >
                {tag.name}
              </Badge>
            ))}
            {tags.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor('totalSpent', {
      header: '總消費',
      cell: info => (
        <div className="text-right">
          <div className="font-medium">NT${(info.getValue() || 0).toLocaleString()}</div>
          <div className="text-xs text-gray-500">{info.row.original.orderCount || 0} 筆訂單</div>
        </div>
      ),
    }),
    columnHelper.accessor('avgOrderValue', {
      header: '平均客單價',
      cell: info => (
        <div className="font-medium text-right">NT${(info.getValue() || 0).toLocaleString()}</div>
      ),
    }),
    columnHelper.accessor('lastPurchaseAt', {
      header: '最後購買',
      cell: info => {
        const date = info.getValue();
        return date ? (
          <div className="text-sm">{new Date(date).toLocaleDateString('zh-TW')}</div>
        ) : (
          <span className="text-gray-400">未購買</span>
        );
      },
    }),
    columnHelper.accessor('churnRisk', {
      header: '流失風險',
      cell: info => (
        <Badge className={`text-white ${churnRiskColors[info.getValue()]}`}>
          {churnRiskLabels[info.getValue()]}
        </Badge>
      ),
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
            title="編輯客戶"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleManageTags(row.original)}
            title="管理標籤"
          >
            <Tag className="h-4 w-4" />
          </Button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: customers,
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
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.PUBLIC_API_URL}/api/customers`, {
        credentials: 'include',
      });
      if (response.ok) {
        const result = await response.json();
        setCustomers(result.success ? result.data.customers : []);
      }
    } catch (error) {
      console.error('Failed to load customers:', error);
      toast.error('載入客戶資料失敗');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerInteractions = async (customerId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.PUBLIC_API_URL}/api/customers/${customerId}/interactions`,
        {
          credentials: 'include',
        }
      );
      if (response.ok) {
        const result = await response.json();
        setCustomerInteractions(result.success ? result.data.interactions : []);
      }
    } catch (error) {
      console.error('Failed to load customer interactions:', error);
    }
  };

  const handleViewDetails = (customer: CustomerProfile) => {
    setSelectedCustomer(customer);
    loadCustomerInteractions(customer.id);
    setIsDetailDialogOpen(true);
  };

  const handleEdit = (customer: CustomerProfile) => {
    // TODO: Implement customer edit dialog
    toast.info('客戶編輯功能開發中');
  };

  const handleManageTags = (customer: CustomerProfile) => {
    // TODO: Implement tag management dialog
    toast.info('標籤管理功能開發中');
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">客戶管理</h1>
          <p className="text-gray-600 mt-2">管理客戶資料與購買記錄</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          新增客戶
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">總客戶數</p>
                <p className="text-2xl font-bold">{customers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">VIP客戶</p>
                <p className="text-2xl font-bold">
                  {customers.filter(c => c.segment === 'vip').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">平均客單價</p>
                <p className="text-2xl font-bold">
                  NT$
                  {customers.length > 0
                    ? Math.round(
                        customers.reduce((sum, c) => sum + (c.avgOrderValue || 0), 0) /
                          customers.length
                      ).toLocaleString()
                    : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">回購客戶</p>
                <p className="text-2xl font-bold">
                  {customers.filter(c => c.orderCount > 1).length}
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
                  placeholder="搜尋客戶編號、姓名、電話、Email..."
                  value={globalFilter}
                  onChange={e => setGlobalFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={(table.getColumn('segment')?.getFilterValue() as string) ?? ''}
              onValueChange={value =>
                table.getColumn('segment')?.setFilterValue(value === 'all' ? '' : value)
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="篩選客戶分級" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分級</SelectItem>
                <SelectItem value="new">新客戶</SelectItem>
                <SelectItem value="regular">一般客戶</SelectItem>
                <SelectItem value="vip">VIP客戶</SelectItem>
                <SelectItem value="inactive">非活躍客戶</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>客戶列表</CardTitle>
          <CardDescription>共 {table.getFilteredRowModel().rows.length} 位客戶</CardDescription>
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

      {/* Customer Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>客戶詳情 - {selectedCustomer?.name}</DialogTitle>
            <DialogDescription>客戶編號：{selectedCustomer?.customerNumber}</DialogDescription>
          </DialogHeader>

          {selectedCustomer && (
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">基本資料</TabsTrigger>
                <TabsTrigger value="purchases">購買記錄</TabsTrigger>
                <TabsTrigger value="interactions">互動歷史</TabsTrigger>
                <TabsTrigger value="analytics">行為分析</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-4">基本資訊</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <strong>姓名：</strong>
                        <span>{selectedCustomer.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>{selectedCustomer.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{selectedCustomer.phone}</span>
                      </div>
                      {selectedCustomer.birthday && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{selectedCustomer.birthday}</span>
                        </div>
                      )}
                      {selectedCustomer.address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 mt-0.5" />
                          <span>
                            {selectedCustomer.address.postalCode} {selectedCustomer.address.city}
                            {selectedCustomer.address.district} {selectedCustomer.address.street}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-4">客戶分級與標籤</h4>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm text-gray-600">客戶分級</Label>
                        <div className="mt-1">
                          <Badge
                            className={`text-white ${segmentColors[selectedCustomer.segment]}`}
                          >
                            {segmentLabels[selectedCustomer.segment]}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">流失風險</Label>
                        <div className="mt-1">
                          <Badge
                            className={`text-white ${churnRiskColors[selectedCustomer.churnRisk]}`}
                          >
                            {churnRiskLabels[selectedCustomer.churnRisk]}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">客戶標籤</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedCustomer.tags.map(tag => (
                            <Badge
                              key={tag.id}
                              variant="outline"
                              style={{ borderColor: tag.color, color: tag.color }}
                            >
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        NT${(selectedCustomer.totalSpent || 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">總消費金額</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedCustomer.orderCount}
                      </div>
                      <div className="text-sm text-gray-600">訂單數量</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        NT${(selectedCustomer.avgOrderValue || 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">平均客單價</div>
                    </CardContent>
                  </Card>
                </div>

                {selectedCustomer.notes && (
                  <div>
                    <h4 className="font-medium mb-2">客戶備註</h4>
                    <div className="bg-gray-50 p-4 rounded-lg text-sm">
                      {selectedCustomer.notes}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="purchases" className="space-y-4">
                <div className="text-center py-8 text-gray-500">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>購買記錄功能開發中</p>
                  <p className="text-sm">將顯示完整的訂單歷史與產品偏好</p>
                </div>
              </TabsContent>

              <TabsContent value="interactions" className="space-y-4">
                <div className="space-y-4">
                  {customerInteractions.length > 0 ? (
                    customerInteractions.map(interaction => (
                      <div key={interaction.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-medium">{interaction.title}</h5>
                            <p className="text-sm text-gray-600 capitalize">{interaction.type}</p>
                            {interaction.description && (
                              <p className="text-sm mt-1">{interaction.description}</p>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(interaction.createdAt).toLocaleDateString('zh-TW')}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>暫無互動記錄</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>行為分析功能開發中</p>
                  <p className="text-sm">將提供購買趨勢、產品偏好等深度分析</p>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
