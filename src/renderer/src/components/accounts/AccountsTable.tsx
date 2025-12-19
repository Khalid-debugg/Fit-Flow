import { useTranslation } from 'react-i18next'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@renderer/components/ui/table'
import { Button } from '@renderer/components/ui/button'
import { Badge } from '@renderer/components/ui/badge'
import { Edit, Trash2, Shield, ShieldOff, ChevronLeft, ChevronRight } from 'lucide-react'
import { User } from '@renderer/models/account'
import { format } from 'date-fns'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '../ui/alert-dialog'

interface AccountsTableProps {
  users: User[]
  page: number
  totalPages: number
  onRowClick: (user: User) => void
  onEdit: (user: User) => void
  onDelete: (id: string) => void
  onPageChange: (page: number) => void
  canEdit: boolean
  canDelete: boolean
}

export default function AccountsTable({
  users,
  page,
  totalPages,
  onRowClick,
  onEdit,
  onDelete,
  onPageChange,
  canEdit,
  canDelete
}: AccountsTableProps) {
  const { t } = useTranslation('accounts')

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-start">#</TableHead>
              <TableHead className="text-start">{t('username')}</TableHead>
              <TableHead className="text-start">{t('fullName')}</TableHead>
              <TableHead className="text-start">{t('email')}</TableHead>
              <TableHead className="text-start">{t('role')}</TableHead>
              <TableHead className="text-start">{t('status')}</TableHead>
              <TableHead className="text-start">{t('lastLogin')}</TableHead>
              <TableHead className="text-end">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user, idx) => (
              <TableRow
                key={user.id}
                className="cursor-pointer hover:bg-gray-700/50"
                onClick={() => onRowClick(user)}
              >
                <TableCell className="font-medium">
                  {users.length === 1 ? '-' : idx + 1 + (page - 1) * 10}
                </TableCell>{' '}
                <TableCell className="font-medium text-white">{user.username}</TableCell>
                <TableCell className="text-gray-300">{user.fullName}</TableCell>
                <TableCell className="text-gray-400">
                  {user.email || <span className="text-gray-500">—</span>}
                </TableCell>
                <TableCell>
                  {user.isAdmin ? (
                    <Badge className="bg-purple-600 hover:bg-purple-700 gap-1">
                      <Shield className="h-3 w-3" />
                      {t('admin')}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-gray-400 border-gray-600">
                      <ShieldOff className="h-3 w-3" />
                      {t('user')}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {user.isActive ? (
                    <Badge className="bg-green-600 hover:bg-green-700">{t('active')}</Badge>
                  ) : (
                    <Badge variant="destructive">{t('inactive')}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-gray-400">
                  {user.lastLogin ? (
                    format(new Date(user.lastLogin), 'MMM dd, yyyy HH:mm')
                  ) : (
                    <span className="text-gray-500">{t('never')}</span>
                  )}
                </TableCell>
                <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-2">
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit(user)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('alert.deleteAccount')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('alert.deleteAccountMessage', { username: user.username })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('form.cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete(user.id!)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              {t('form.confirm')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-gray-400">
            {t('pagination.page')} {page} {t('pagination.of')} {totalPages}
          </p>
          <div className="flex gap-2 ltr:flex-row rtl:flex-row-reverse">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              {t('pagination.previous')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
              {t('pagination.next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
