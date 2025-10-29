import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@renderer/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@renderer/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@renderer/components/ui/alert-dialog'
import { Label } from '@renderer/components/ui/label'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { Member } from '@renderer/models/member'

export default function Members() {
  const { t } = useTranslation()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [errorDialog, setErrorDialog] = useState({ open: false, message: '' })
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    address: '',
    emergency_contact: '',
    emergency_phone: '',
    join_date: new Date().toISOString().split('T')[0],
    status: 'active',
    notes: ''
  })

  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    setLoading(true)
    try {
      const data = await window.electron.ipcRenderer.invoke('members:getAll')
      setMembers(data)
    } catch (error) {
      console.error('Failed to load members:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await window.electron.ipcRenderer.invoke('members:create', formData)
      setDialogOpen(false)
      setFormData({
        name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        gender: '',
        address: '',
        emergency_contact: '',
        emergency_phone: '',
        join_date: new Date().toISOString().split('T')[0],
        status: 'active',
        notes: ''
      })
      loadMembers()
    } catch (error) {
      console.error('Failed to create member:', error)

      if (
        (error as Error).message &&
        (error as Error).message.includes('UNIQUE constraint failed: members.email')
      ) {
        setErrorDialog({ open: true, message: t('members.errors.emailExists') })
      } else {
        setErrorDialog({ open: true, message: t('members.errors.createFailed') })
      }
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm(t('members.errors.deleteConfirm'))) {
      try {
        await window.electron.ipcRenderer.invoke('members:delete', id)
        loadMembers()
      } catch (error) {
        console.error('Failed to delete member:', error)
        setErrorDialog({ open: true, message: t('members.errors.deleteFailed') })
      }
    }
  }

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.phone.includes(searchQuery)
  )

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-500/20 text-green-400',
      inactive: 'bg-gray-500/20 text-gray-400',
      expired: 'bg-red-500/20 text-red-400'
    }
    return colors[status] || colors.inactive
  }

  return (
    <div className="space-y-6">
      <AlertDialog
        open={errorDialog.open}
        onOpenChange={(open) => setErrorDialog({ ...errorDialog, open })}
      >
        <AlertDialogContent className="bg-gray-900 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">خطأ / Error</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              {errorDialog.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorDialog({ open: false, message: '' })}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('members.title')}</h1>
          <p className="text-gray-400 mt-1">
            {t('members.memberCount', { count: members.length })}
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t('members.addNew')}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">{t('members.addNew')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-200">
                    {t('members.form.name')} *
                  </Label>
                  <Input
                    id="name"
                    required
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-200">
                    {t('members.form.email')}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-200">
                    {t('members.form.phone')} *
                  </Label>
                  <Input
                    id="phone"
                    required
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth" className="text-gray-200">
                    {t('members.form.dateOfBirth')}
                  </Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-gray-200">
                    {t('members.form.gender')}
                  </Label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                  >
                    <option value="">{t('members.form.selectGender')}</option>
                    <option value="male">{t('members.form.male')}</option>
                    <option value="female">{t('members.form.female')}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="join_date" className="text-gray-200">
                    {t('members.joinDate')} *
                  </Label>
                  <Input
                    id="join_date"
                    type="date"
                    required
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.join_date}
                    onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="address" className="text-gray-200">
                    {t('members.form.address')}
                  </Label>
                  <Input
                    id="address"
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="notes" className="text-gray-200">
                    {t('members.form.notes')}
                  </Label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white min-h-[80px]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  {t('members.form.cancel')}
                </Button>
                <Button type="submit">{t('members.form.submit')}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={t('members.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ps-10"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">{t('members.loading')}</div>
      ) : filteredMembers.length === 0 ? (
        <div className="text-center py-12 text-gray-400">{t('members.noMembers')}</div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">{t('members.name')}</TableHead>
                <TableHead className="text-start">{t('members.email')}</TableHead>
                <TableHead className="text-start">{t('members.phone')}</TableHead>
                <TableHead className="text-start">{t('members.joinDate')}</TableHead>
                <TableHead className="text-start">{t('members.status')}</TableHead>
                <TableHead className="text-end">{t('members.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell className="text-gray-400">{member.email}</TableCell>
                  <TableCell className="text-gray-400">{member.phone}</TableCell>
                  <TableCell className="text-gray-400">
                    {new Date(member.join_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(member.status)}`}
                    >
                      {t(`members.${member.status}`)}
                    </span>
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(member.id)}>
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
