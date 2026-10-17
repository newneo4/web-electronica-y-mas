import { useMemo, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Search,
  Trash2,
  UserX,
} from 'lucide-react';
import type { Role } from '@/features/auth/types/auth.types';
import type {
  ManagedUser,
  UserStatus,
} from '@/features/users/types/user.types';
import { EmptyState } from '@/components/common/EmptyState';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate, getInitials } from '@/lib/utils';

interface UsersDataTableProps {
  users: ManagedUser[];
  isLoading: boolean;
  canDelete: boolean;
  onEditUser: (user: ManagedUser) => void;
  onDeleteUser: (user: ManagedUser) => void;
}

const ROLE_BADGE_VARIANT: Record<
  Role,
  'default' | 'info' | 'secondary' | 'warning'
> = {
  ADMIN: 'default',
  COORDINADOR: 'info',
  SUPERVISOR: 'secondary',
  TECNICO: 'warning',
};

const STATUS_CONFIG: Record<
  UserStatus,
  { label: string; variant: 'success' | 'warning' | 'outline' }
> = {
  ACTIVE: { label: 'Activo', variant: 'success' },
  PENDING: { label: 'Pendiente', variant: 'warning' },
  INACTIVE: { label: 'Inactivo', variant: 'outline' },
};

export function UsersDataTable({
  users,
  isLoading,
  canDelete,
  onEditUser,
  onDeleteUser,
}: UsersDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = useMemo<ColumnDef<ManagedUser>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="inline-flex items-center gap-1 font-medium hover:text-foreground"
          >
            <span>Usuario / Correo</span>
            <ArrowUpDown className="h-3.5 w-3.5" />
          </button>
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{getInitials(item.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {item.name}
                </p>
                <p className="text-xs text-muted-foreground">{item.email}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'department',
        header: 'Departamento B2B',
        cell: ({ row }) => (
          <span className="text-xs text-foreground">
            {row.original.department}
          </span>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Rol RBAC',
        filterFn: 'equalsString',
        cell: ({ row }) => {
          const role = row.original.role;
          return <Badge variant={ROLE_BADGE_VARIANT[role]}>{role}</Badge>;
        },
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) => {
          const status = row.original.status;
          const config = STATUS_CONFIG[status];
          return <Badge variant={config.variant}>{config.label}</Badge>;
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Alta',
        cell: ({ row }) => (
          <div className="text-xs">
            <p className="text-foreground">
              {formatDate(row.original.createdAt)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {row.original.lastActive}
            </p>
          </div>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Acciones</div>,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditUser(item)}
                title="Editar usuario"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:text-xs">
                  Editar
                </span>
              </Button>
              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteUser(item)}
                  title="Eliminar usuario (Solo ADMIN)"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [canDelete, onDeleteUser, onEditUser]
  );

  const table = useReactTable({
    data: users,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue: string) => {
      const search = filterValue.toLowerCase().trim();
      if (!search) return true;
      return (
        row.original.name.toLowerCase().includes(search) ||
        row.original.email.toLowerCase().includes(search) ||
        row.original.department.toLowerCase().includes(search)
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const currentRoleFilter =
    (table.getColumn('role')?.getFilterValue() as string | undefined) ?? 'ALL';

  const handleRoleFilterChange = (value: string) => {
    table
      .getColumn('role')
      ?.setFilterValue(value === 'ALL' ? undefined : value);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar: Search + Role Filter */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o área..."
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Filtrar por Rol:
          </span>
          <Select
            value={currentRoleFilter}
            onValueChange={handleRoleFilterChange}
          >
            <SelectTrigger className="w-[165px]">
              <SelectValue placeholder="Todos los roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los roles</SelectItem>
              <SelectItem value="ADMIN">ADMIN</SelectItem>
              <SelectItem value="COORDINADOR">COORDINADOR</SelectItem>
              <SelectItem value="SUPERVISOR">SUPERVISOR</SelectItem>
              <SelectItem value="TECNICO">TECNICO</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Table Container */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-36" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-8 w-16" />
                  </TableCell>
                </TableRow>
              ))
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="p-6">
                  <EmptyState
                    icon={UserX}
                    title="No se encontraron usuarios"
                    description="No hay registros que coincidan con los filtros aplicados actualmente."
                    action={
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setGlobalFilter('');
                          handleRoleFilterChange('ALL');
                        }}
                      >
                        Limpiar filtros
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
        <div>
          Mostrando{' '}
          <strong className="text-foreground">
            {table.getRowModel().rows.length}
          </strong>{' '}
          de{' '}
          <strong className="text-foreground">
            {table.getFilteredRowModel().rows.length}
          </strong>{' '}
          usuarios filtrados
        </div>

        <div className="flex items-center gap-2">
          <span>
            Página{' '}
            <strong className="text-foreground">
              {table.getState().pagination.pageIndex + 1}
            </strong>{' '}
            de{' '}
            <strong className="text-foreground">
              {Math.max(table.getPageCount(), 1)}
            </strong>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Anterior</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span>Siguiente</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
