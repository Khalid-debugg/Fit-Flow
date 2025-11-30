import { useTranslation } from 'react-i18next'
import { Button } from '@renderer/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@renderer/components/ui/table'
import { Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Member } from '@renderer/models/member'
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

interface MembersTableProps {
  members: Member[]
  page: number
  totalPages: number
  onRowClick: (member: Member) => void
  onEdit: (member: Member) => void
  onDelete: (id: number) => void
  onPageChange: (page: number) => void
}

export default function MembersTable({
  members,
  page,
  totalPages,
  onRowClick,
  onEdit,
  onDelete,
  onPageChange
}: MembersTableProps) {
  const { t } = useTranslation('members')

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-500/20 text-green-400',
      expired: 'bg-yellow-500/20 text-yellow-400',
      inactive: 'bg-red-500/20 text-red-400'
    }
    return colors[status] || colors.inactive
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-start">#</TableHead>
              <TableHead className="text-start">{t('name')}</TableHead>
              <TableHead className="text-start">{t('phone')}</TableHead>
              <TableHead className="text-start">{t('email')}</TableHead>
              <TableHead className="text-start">{t('gender')}</TableHead>
              <TableHead className="text-start">{t('joinDate')}</TableHead>
              <TableHead className="text-start">{t('status')}</TableHead>
              <TableHead className="text-end">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member, idx) => (
              <TableRow
                key={member.id}
                className="cursor-pointer hover:bg-gray-700/50"
                onClick={() => onRowClick(member)}
              >
                <TableCell className="font-medium">
                  {members.length === 1 ? '-' : idx + 1 + (page - 1) * 10}
                </TableCell>
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell className="text-gray-400">
                  {member.countryCode}
                  {member.phone}
                </TableCell>
                <TableCell className="text-gray-400">{member.email || 'N/A'}</TableCell>
                <TableCell className="text-gray-400">{t(`${member.gender}`)}</TableCell>
                <TableCell className="text-gray-400">{member.joinDate}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(member.status)}`}
                  >
                    {t(`${member.status}`)}
                  </span>
                </TableCell>
                <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(member)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('alert.deleteMember')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('alert.deleteMemberMessage')}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('form.cancel')}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(member.id!)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            {t('form.confirm')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
              <ChevronLeft className="h-4 w-4 " />
              {t('pagination.previous')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4 " />
              {t('pagination.next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
