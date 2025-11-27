import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    useReactTable,
    type SortingState,
    type ColumnFiltersState,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import PlusIcon from '@lucide/react/plus';
import PencilIcon from '@lucide/react/pencil';
import TrashIcon from '@lucide/react/trash';
import Search from '@lucide/react/search';
import MoreHorizontal from '@lucide/react/more-horizontal';

import { Button } from '@blackliving/ui';
import { Input } from '@blackliving/ui';
import { Badge } from '@blackliving/ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@blackliving/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@blackliving/ui';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@blackliving/ui';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@blackliving/ui';
import { Skeleton } from '@blackliving/ui';
import { toast } from 'sonner';

import { useApiUrl } from '../contexts/EnvironmentContext';

interface Page {
    id: string;
    title: string;
    slug: string;
    status: 'draft' | 'published' | 'archived';
    authorId: string;
    publishedAt?: string;
    createdAt: string;
    updatedAt: string;
}

const statusConfig = {
    draft: { label: '草稿', color: 'bg-gray-100 text-gray-800' },
    published: { label: '已發布', color: 'bg-green-100 text-green-800' },
    archived: { label: '已封存', color: 'bg-yellow-100 text-yellow-800' },
};

const columnHelper = createColumnHelper<Page>();

export default function PageManagement() {
    const navigate = useNavigate();
    const [pages, setPages] = useState<Page[]>([]);
    const [loading, setLoading] = useState(true);
    const apiUrl = useApiUrl();
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedPage, setSelectedPage] = useState<Page | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const fetchPages = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${apiUrl}/api/pages`, {
                credentials: 'include',
            });
            if (!response.ok) throw new Error('Failed to fetch pages');
            const json = await response.json();
            if (json.success) {
                // Handle both old array format and new paginated format
                setPages(Array.isArray(json.data) ? json.data : json.data.pages);
            }
        } catch (error) {
            console.error('Error fetching pages:', error);
            toast.error('載入頁面列表失敗');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPages();
    }, []);

    const deletePage = async (pageId: string) => {
        try {
            const response = await fetch(`${apiUrl}/api/pages/${pageId}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (response.ok) {
                toast.success('頁面已刪除');
                fetchPages();
            } else {
                throw new Error('Failed to delete page');
            }
        } catch (error) {
            console.error('Error deleting page:', error);
            toast.error('刪除頁面失敗');
        }
    };

    const columns = [
        columnHelper.accessor('title', {
            header: '標題',
            cell: (info) => (
                <div className="font-medium text-foreground">{info.getValue()}</div>
            ),
        }),
        columnHelper.accessor('slug', {
            header: '網址路徑',
            cell: (info) => (
                <div className="text-sm text-muted-foreground">/{info.getValue()}</div>
            ),
        }),
        columnHelper.accessor('status', {
            header: '狀態',
            cell: (info) => {
                const status = info.getValue();
                const config = statusConfig[status] || statusConfig.draft;
                return <Badge className={`${config.color} text-xs font-medium`}>{config.label}</Badge>;
            },
        }),
        columnHelper.accessor('publishedAt', {
            header: '發布時間',
            cell: (info) => {
                const date = info.getValue();
                return date ? (
                    <div className="text-sm text-muted-foreground">
                        {format(new Date(date), 'yyyy/MM/dd HH:mm', { locale: zhTW })}
                    </div>
                ) : (
                    <span className="text-muted-foreground">-</span>
                );
            },
        }),
        columnHelper.display({
            id: 'actions',
            header: '操作',
            cell: (info) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/dashboard/pages/${info.row.original.id}/edit`)}>
                            <PencilIcon className="h-4 w-4 mr-2" />
                            編輯頁面
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => {
                                setSelectedPage(info.row.original);
                                setShowDeleteDialog(true);
                            }}
                            className="text-red-600"
                        >
                            <TrashIcon className="h-4 w-4 mr-2" />
                            刪除頁面
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        }),
    ];

    const table = useReactTable({
        data: pages,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        state: {
            sorting,
            columnFilters,
            globalFilter,
        },
    });

    useEffect(() => {
        if (statusFilter !== 'all') {
            setColumnFilters([{ id: 'status', value: statusFilter }]);
        } else {
            setColumnFilters([]);
        }
    }, [statusFilter]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <Skeleton className="h-8 w-32 mb-2" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-10 w-28" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">頁面管理</h1>
                    <p className="text-muted-foreground">管理網站的動態頁面</p>
                </div>
                <Button onClick={() => navigate('/dashboard/pages/new')}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    新增頁面
                </Button>
            </div>

            <div className="flex gap-4 items-center bg-white p-4 rounded-lg border">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="搜尋頁面..."
                        value={globalFilter ?? ''}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="狀態篩選" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">所有狀態</SelectItem>
                        <SelectItem value="published">已發布</SelectItem>
                        <SelectItem value="draft">草稿</SelectItem>
                        <SelectItem value="archived">已封存</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    沒有找到頁面
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>確定要刪除此頁面嗎？</AlertDialogTitle>
                        <AlertDialogDescription>
                            此動作無法復原。這將永久刪除頁面 "{selectedPage?.title}"。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (selectedPage) {
                                    deletePage(selectedPage.id);
                                    setShowDeleteDialog(false);
                                }
                            }}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            刪除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
