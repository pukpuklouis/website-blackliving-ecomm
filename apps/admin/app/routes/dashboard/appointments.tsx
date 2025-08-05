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
import {
  Search,
  Eye,
  Edit,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Users,
} from 'lucide-react';
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

interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
}

interface Appointment {
  id: string;
  appointmentNumber: string;
  userId?: string;
  customerInfo: CustomerInfo;
  storeLocation: 'zhonghe' | 'zhongli';
  preferredDate: string;
  preferredTime: 'morning' | 'afternoon' | 'evening';
  confirmedDateTime?: Date;
  productInterest: string[];
  visitPurpose: 'trial' | 'consultation' | 'pricing';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes: string;
  adminNotes: string;
  staffAssigned?: string;
  actualVisitTime?: Date;
  completedAt?: Date;
  followUpRequired: boolean;
  followUpNotes: string;
  createdAt: Date;
  updatedAt: Date;
}

const statusLabels = {
  pending: '待確認',
  confirmed: '已確認',
  completed: '已完成',
  cancelled: '已取消',
  no_show: '未到場',
};

const statusColors = {
  pending: 'bg-yellow-500',
  confirmed: 'bg-blue-500',
  completed: 'bg-green-500',
  cancelled: 'bg-gray-500',
  no_show: 'bg-red-500',
};

const storeLabels = {
  zhonghe: '中和店',
  zhongli: '中壢店',
};

const timeLabels = {
  morning: '上午 (09:00-12:00)',
  afternoon: '下午 (13:00-17:00)',
  evening: '晚上 (18:00-21:00)',
};

const purposeLabels = {
  trial: '試躺體驗',
  consultation: '產品諮詢',
  pricing: '價格洽談',
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Appointment>>({});

  const columnHelper = createColumnHelper<Appointment>();

  const columns = [
    columnHelper.accessor('appointmentNumber', {
      header: '預約編號',
      cell: info => <div className="font-mono text-sm font-medium">{info.getValue()}</div>,
    }),
    columnHelper.accessor('customerInfo', {
      header: '客戶資訊',
      cell: info => {
        const customer = info.getValue();
        return (
          <div>
            <div className="font-medium flex items-center gap-1">
              <User className="h-3 w-3" />
              {customer.name}
            </div>
            <div className="text-sm text-gray-600 flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {customer.phone}
            </div>
            {customer.email && <div className="text-sm text-gray-600">{customer.email}</div>}
          </div>
        );
      },
    }),
    columnHelper.accessor('storeLocation', {
      header: '門市',
      cell: info => (
        <Badge variant="outline" className="flex items-center gap-1 w-fit">
          <MapPin className="h-3 w-3" />
          {storeLabels[info.getValue()]}
        </Badge>
      ),
      filterFn: 'equals',
    }),
    columnHelper.accessor('preferredDate', {
      header: '預約日期',
      cell: info => {
        const appointment = info.row.original;
        return (
          <div>
            <div className="font-medium flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(info.getValue()).toLocaleDateString('zh-TW')}
            </div>
            <div className="text-sm text-gray-600 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeLabels[appointment.preferredTime]}
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor('visitPurpose', {
      header: '目的',
      cell: info => <Badge variant="secondary">{purposeLabels[info.getValue()]}</Badge>,
    }),
    columnHelper.accessor('status', {
      header: '狀態',
      cell: info => (
        <Badge className={`text-white ${statusColors[info.getValue()]}`}>
          {statusLabels[info.getValue()]}
        </Badge>
      ),
      filterFn: 'equals',
    }),
    columnHelper.accessor('staffAssigned', {
      header: '服務人員',
      cell: info => info.getValue() || <span className="text-gray-400">未指派</span>,
    }),
    columnHelper.accessor('createdAt', {
      header: '建立時間',
      cell: info =>
        new Date(info.getValue()).toLocaleDateString('zh-TW', {
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
            title="編輯預約"
          >
            <Edit className="h-4 w-4" />
          </Button>
          {row.original.status === 'pending' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleUpdateStatus(row.original.id, 'confirmed')}
              title="確認預約"
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
          {row.original.status === 'confirmed' &&
            new Date(row.original.preferredDate) <= new Date() && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUpdateStatus(row.original.id, 'completed')}
                title="標記完成"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: appointments,
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
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8787/api/appointments');
      if (response.ok) {
        const result = await response.json();
        setAppointments(result.success ? result.data.appointments : []);
      }
    } catch (error) {
      console.error('Failed to load appointments:', error);
      toast.error('載入預約失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailDialogOpen(true);
  };

  const handleEdit = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setEditFormData(appointment);
    setIsEditDialogOpen(true);
  };

  const handleUpdateStatus = async (appointmentId: string, newStatus: Appointment['status']) => {
    try {
      const response = await fetch(
        `http://localhost:8787/api/appointments/${appointmentId}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        setAppointments(prev =>
          prev.map(appointment =>
            appointment.id === appointmentId
              ? { ...appointment, status: newStatus, updatedAt: new Date() }
              : appointment
          )
        );
        toast.success('預約狀態更新成功');
      } else {
        throw new Error('Failed to update appointment status');
      }
    } catch (error) {
      console.error('Update status failed:', error);
      toast.error('更新預約狀態失敗');
    }
  };

  const handleConfirmAppointment = async (appointmentId: string, confirmedDateTime: string) => {
    try {
      const response = await fetch(
        `http://localhost:8787/api/appointments/${appointmentId}/confirm`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            status: 'confirmed',
            confirmedDateTime: new Date(confirmedDateTime).toISOString(),
          }),
        }
      );

      if (response.ok) {
        await loadAppointments();
        toast.success('預約確認成功');
      } else {
        throw new Error('Failed to confirm appointment');
      }
    } catch (error) {
      console.error('Confirm appointment failed:', error);
      toast.error('確認預約失敗');
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
        <h1 className="text-3xl font-bold text-gray-900">預約管理</h1>
        <p className="text-gray-600 mt-2">管理試躺預約與門市參觀</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">待確認</p>
                <p className="text-2xl font-bold">
                  {appointments.filter(a => a.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">已確認</p>
                <p className="text-2xl font-bold">
                  {appointments.filter(a => a.status === 'confirmed').length}
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
                  {appointments.filter(a => a.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">未到場</p>
                <p className="text-2xl font-bold">
                  {appointments.filter(a => a.status === 'no_show').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">需追蹤</p>
                <p className="text-2xl font-bold">
                  {appointments.filter(a => a.followUpRequired).length}
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
                  placeholder="搜尋預約編號、客戶姓名、電話..."
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
                <SelectItem value="pending">待確認</SelectItem>
                <SelectItem value="confirmed">已確認</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="cancelled">已取消</SelectItem>
                <SelectItem value="no_show">未到場</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={(table.getColumn('storeLocation')?.getFilterValue() as string) ?? ''}
              onValueChange={value =>
                table.getColumn('storeLocation')?.setFilterValue(value === 'all' ? '' : value)
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="門市" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部門市</SelectItem>
                <SelectItem value="zhonghe">中和店</SelectItem>
                <SelectItem value="zhongli">中壢店</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card>
        <CardHeader>
          <CardTitle>預約列表</CardTitle>
          <CardDescription>共 {table.getFilteredRowModel().rows.length} 筆預約</CardDescription>
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

      {/* Appointment Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>預約詳情 - {selectedAppointment?.appointmentNumber}</DialogTitle>
            <DialogDescription>查看完整的預約資訊與服務狀態</DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">預約資訊</TabsTrigger>
                <TabsTrigger value="service">服務記錄</TabsTrigger>
                <TabsTrigger value="followup">後續追蹤</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">客戶資訊</h4>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="text-gray-600">姓名：</span>
                        {selectedAppointment.customerInfo.name}
                      </p>
                      <p>
                        <span className="text-gray-600">電話：</span>
                        {selectedAppointment.customerInfo.phone}
                      </p>
                      {selectedAppointment.customerInfo.email && (
                        <p>
                          <span className="text-gray-600">Email：</span>
                          {selectedAppointment.customerInfo.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">預約狀態</h4>
                    <Badge className={`text-white ${statusColors[selectedAppointment.status]}`}>
                      {statusLabels[selectedAppointment.status]}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">門市地點</h4>
                    <Badge variant="outline" className="flex items-center gap-1 w-fit">
                      <MapPin className="h-3 w-3" />
                      {storeLabels[selectedAppointment.storeLocation]}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">拜訪目的</h4>
                    <Badge variant="secondary">
                      {purposeLabels[selectedAppointment.visitPurpose]}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">希望日期時間</h4>
                    <div className="text-sm">
                      <p className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(selectedAppointment.preferredDate).toLocaleDateString('zh-TW')}
                      </p>
                      <p className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {timeLabels[selectedAppointment.preferredTime]}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">確認時間</h4>
                    <p className="text-sm">
                      {selectedAppointment.confirmedDateTime
                        ? new Date(selectedAppointment.confirmedDateTime).toLocaleString('zh-TW')
                        : '尚未確認'}
                    </p>
                  </div>
                </div>

                {selectedAppointment.productInterest.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">感興趣的產品</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedAppointment.productInterest.map((product, index) => (
                        <Badge key={index} variant="outline">
                          {product}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAppointment.notes && (
                  <div>
                    <h4 className="font-medium mb-2">客戶備註</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {selectedAppointment.notes}
                    </p>
                  </div>
                )}

                {selectedAppointment.adminNotes && (
                  <div>
                    <h4 className="font-medium mb-2">管理員備註</h4>
                    <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                      {selectedAppointment.adminNotes}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="service" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">指派服務人員</h4>
                    <p className="text-sm">{selectedAppointment.staffAssigned || '尚未指派'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">實際到店時間</h4>
                    <p className="text-sm">
                      {selectedAppointment.actualVisitTime
                        ? new Date(selectedAppointment.actualVisitTime).toLocaleString('zh-TW')
                        : '尚未到店'}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">完成時間</h4>
                  <p className="text-sm">
                    {selectedAppointment.completedAt
                      ? new Date(selectedAppointment.completedAt).toLocaleString('zh-TW')
                      : '尚未完成'}
                  </p>
                </div>

                {selectedAppointment.status === 'pending' && (
                  <div className="flex justify-end">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button>確認預約</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>確認預約</AlertDialogTitle>
                          <AlertDialogDescription>
                            確定要確認這個預約嗎？請先與客戶聯繫確認時間。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              handleConfirmAppointment(
                                selectedAppointment.id,
                                selectedAppointment.preferredDate
                              )
                            }
                          >
                            確認預約
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="followup" className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch checked={selectedAppointment.followUpRequired} readOnly />
                  <Label>需要後續追蹤</Label>
                </div>

                {selectedAppointment.followUpNotes && (
                  <div>
                    <h4 className="font-medium mb-2">追蹤備註</h4>
                    <p className="text-sm text-gray-600 bg-amber-50 p-3 rounded-lg">
                      {selectedAppointment.followUpNotes}
                    </p>
                  </div>
                )}

                <div className="text-sm text-gray-500">
                  <p>建立時間：{new Date(selectedAppointment.createdAt).toLocaleString('zh-TW')}</p>
                  <p>最後更新：{new Date(selectedAppointment.updatedAt).toLocaleString('zh-TW')}</p>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
