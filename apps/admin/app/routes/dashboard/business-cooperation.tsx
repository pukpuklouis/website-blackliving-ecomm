import { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Button,
    Input,
    Badge,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@blackliving/ui';
import Search from '@lucide/react/search';
import Eye from '@lucide/react/eye';
import Calendar from '@lucide/react/calendar';
import Mail from '@lucide/react/mail';
import Phone from '@lucide/react/phone';
import Filter from '@lucide/react/filter';
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
import { useApiUrl } from '../../contexts/EnvironmentContext';

interface BusinessCooperationRequest {
    id: string;
    name: string;
    email: string;
    phone: string;
    subject: string;
    content: string;
    status: 'new' | 'replied' | 'closed';
    createdAt: string;
}

const statusLabels = {
    new: '新進',
    replied: '已回覆',
    closed: '已結案',
};

const statusColors = {
    new: 'bg-blue-500',
    replied: 'bg-green-500',
    closed: 'bg-gray-500',
};

export default function BusinessCooperationPage() {
    const apiUrl = useApiUrl();
    const [requests, setRequests] = useState<BusinessCooperationRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedRequest, setSelectedRequest] = useState<BusinessCooperationRequest | null>(null);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

    const columnHelper = createColumnHelper<BusinessCooperationRequest>();

    const columns = [
        columnHelper.accessor('name', {
            header: '姓名',
            cell: (info) => <div className="font-medium">{info.getValue()}</div>,
        }),
        columnHelper.accessor('subject', {
            header: '主旨',
            cell: (info) => <div className="truncate max-w-[200px]">{info.getValue()}</div>,
        }),
        columnHelper.accessor('email', {
            header: '聯絡方式',
            cell: (info) => {
                const request = info.row.original;
                return (
                    <div className="text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {request.email}
                        </div>
                        <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {request.phone}
                        </div>
                    </div>
                );
            },
        }),
        columnHelper.accessor('status', {
            header: '狀態',
            cell: (info) => (
                <Badge className={`text-white ${statusColors[info.getValue()]}`}>
                    {statusLabels[info.getValue()]}
                </Badge>
            ),
            filterFn: 'equals',
        }),
        columnHelper.accessor('createdAt', {
            header: '建立時間',
            cell: (info) => (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Calendar className="h-3 w-3" />
                    {new Date(info.getValue()).toLocaleDateString('zh-TW')}
                </div>
            ),
        }),
        columnHelper.display({
            id: 'actions',
            header: '操作',
            cell: ({ row }) => (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetails(row.original)}
                    title="查看詳情"
                >
                    <Eye className="h-4 w-4" />
                </Button>
            ),
        }),
    ];

    const table = useReactTable({
        data: requests,
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
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${apiUrl}/api/business-cooperation`);
            if (response.ok) {
                const result = await response.json();
                setRequests(result.success ? result.data.requests : []);
            }
        } catch (error) {
            console.error('Failed to load requests:', error);
            toast.error('載入列表失敗');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (request: BusinessCooperationRequest) => {
        setSelectedRequest(request);
        setIsDetailDialogOpen(true);
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
            <div>
                <h1 className="text-3xl font-bold text-gray-900">異業合作</h1>
                <p className="text-gray-600 mt-2">管理異業合作申請與洽談</p>
            </div>

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
                                    placeholder="搜尋姓名、Email、主旨..."
                                    value={globalFilter}
                                    onChange={(e) => setGlobalFilter(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Select
                            value={(table.getColumn('status')?.getFilterValue() as string) ?? ''}
                            onValueChange={(value) =>
                                table.getColumn('status')?.setFilterValue(value === 'all' ? '' : value)
                            }
                        >
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="篩選狀態" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">全部狀態</SelectItem>
                                <SelectItem value="new">新進</SelectItem>
                                <SelectItem value="replied">已回覆</SelectItem>
                                <SelectItem value="closed">已結案</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>申請列表</CardTitle>
                    <CardDescription>共 {table.getFilteredRowModel().rows.length} 筆申請</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="w-full">
                            <thead>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <tr key={headerGroup.id} className="border-b bg-gray-50/50">
                                        {headerGroup.headers.map((header) => (
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
                                {table.getRowModel().rows.map((row) => (
                                    <tr key={row.id} className="border-b hover:bg-gray-50/50">
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className="px-4 py-3">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between px-2 py-4">
                        <div className="text-sm text-gray-700">
                            顯示 {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} 到{' '}
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

            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>合作申請詳情</DialogTitle>
                        <DialogDescription>
                            {selectedRequest?.name} - {selectedRequest?.subject}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedRequest && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-medium mb-1 text-sm text-gray-500">申請人</h4>
                                    <p>{selectedRequest.name}</p>
                                </div>
                                <div>
                                    <h4 className="font-medium mb-1 text-sm text-gray-500">狀態</h4>
                                    <Badge className={`text-white ${statusColors[selectedRequest.status]}`}>
                                        {statusLabels[selectedRequest.status]}
                                    </Badge>
                                </div>
                                <div>
                                    <h4 className="font-medium mb-1 text-sm text-gray-500">Email</h4>
                                    <p>{selectedRequest.email}</p>
                                </div>
                                <div>
                                    <h4 className="font-medium mb-1 text-sm text-gray-500">電話</h4>
                                    <p>{selectedRequest.phone}</p>
                                </div>
                                <div>
                                    <h4 className="font-medium mb-1 text-sm text-gray-500">建立時間</h4>
                                    <p>{new Date(selectedRequest.createdAt).toLocaleString('zh-TW')}</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium mb-2 text-sm text-gray-500">內容</h4>
                                <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                                    {selectedRequest.content}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
