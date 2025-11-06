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
  const { t } = useTranslation()

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-500/20 text-green-400',
      inactive: 'bg-gray-500/20 text-gray-400'
    }
    return colors[status] || colors.inactive
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-start">{t('members.index')}</TableHead>
              <TableHead className="text-start">{t('members.name')}</TableHead>
              <TableHead className="text-start">{t('members.phone')}</TableHead>
              <TableHead className="text-start">{t('members.email')}</TableHead>
              <TableHead className="text-start">{t('members.gender')}</TableHead>
              <TableHead className="text-start">{t('members.joinDate')}</TableHead>
              <TableHead className="text-start">{t('members.status')}</TableHead>
              <TableHead className="text-end">{t('members.actions')}</TableHead>
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
                <TableCell className="text-gray-400">{member.phone}</TableCell>
                <TableCell className="text-gray-400">{member.email || 'N/A'}</TableCell>
                <TableCell className="text-gray-400">{t(`members.${member.gender}`)}</TableCell>
                <TableCell className="text-gray-400">{member.join_date}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(member.status)}`}
                  >
                    {t(`members.${member.status}`)}
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
                          <AlertDialogTitle>{t('members.alert.deleteMember')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('members.alert.deleteMemberMessage')}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('members.form.cancel')}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(member.id!)}>
                            {t('members.form.confirm')}
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
            {t('members.pagination.page')} {page} {t('members.pagination.of')} {totalPages}
          </p>
          <div className="flex gap-2 ltr:flex-row rtl:flex-row-reverse">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4 " />
              {t('members.pagination.previous')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4 " />
              {t('members.pagination.next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
