import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  User,
  UserRole,
  getAllPermissionsEnabled,
  getPermissionsForRole,
  detectRoleFromPermissions,
  getEmptyPermissions,
  PERMISSIONS
} from '@renderer/models/account'
import PermissionsSelector from './PermissionsSelector'
import RoleSelector from './RoleSelector'
import { useAuth } from '@renderer/hooks/useAuth'

interface CreateAccountProps {
  onSuccess: () => void
}

export default function CreateAccount({ onSuccess }: CreateAccountProps) {
  const { t, i18n } = useTranslation('accounts')
  const { hasPermission } = useAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const isRTL = i18n.language === 'ar'

  // Check permissions
  const canManageAdmin = hasPermission(PERMISSIONS.accounts.manage_admin)
  const canManagePermissions = hasPermission(PERMISSIONS.accounts.manage_permissions)
  const [formData, setFormData] = useState<
    Partial<User> & { password: string; confirmPassword: string; role: UserRole }
  >({
    username: '',
    fullName: '',
    email: null,
    password: '',
    confirmPassword: '',
    isAdmin: false,
    isActive: true,
    role: 'custom',
    permissions: getEmptyPermissions()
  })

  const handleRoleChange = (newRole: UserRole) => {
    // Prevent setting admin role if user doesn't have permission
    if (newRole === 'admin' && !canManageAdmin) {
      toast.error(t('errors.noPermissionManageAdmin'))
      return
    }

    // When role is admin, set isAdmin to true and give all permissions
    const isAdmin = newRole === 'admin'
    const permissions = isAdmin ? getAllPermissionsEnabled() : getPermissionsForRole(newRole)

    setFormData({
      ...formData,
      role: newRole,
      isAdmin,
      permissions
    })
  }

  const handlePermissionsChange = (permissions: typeof formData.permissions) => {
    // Only allow if user has permission to manage permissions
    if (!canManagePermissions) {
      toast.error(t('errors.noPermissionManagePermissions'))
      return
    }

    // Detect which role matches the new permissions
    const detectedRole = detectRoleFromPermissions(permissions!)
    const isAdmin = detectedRole === 'admin'

    // Prevent setting admin if user doesn't have permission
    if (isAdmin && !canManageAdmin) {
      toast.error(t('errors.noPermissionManageAdmin'))
      return
    }

    setFormData({
      ...formData,
      role: detectedRole,
      isAdmin,
      permissions
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.username || !formData.fullName || !formData.password) {
      toast.error(t('errors.requiredFields'))
      return
    }

    // Username validation
    if (formData.username.length < 3) {
      toast.error(t('errors.usernameTooShort'))
      return
    }

    if (formData.username.length > 20) {
      toast.error(t('errors.usernameTooLong'))
      return
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      toast.error(t('errors.usernameInvalidCharacters'))
      return
    }

    if (/^[_-]|[_-]$/.test(formData.username)) {
      toast.error(t('errors.usernameInvalidFormat'))
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error(t('errors.passwordsDoNotMatch'))
      return
    }

    if (formData.password.length < 6) {
      toast.error(t('errors.passwordTooShort'))
      return
    }

    setLoading(true)
    try {
      await window.electron.ipcRenderer.invoke('accounts:create', {
        username: formData.username,
        fullName: formData.fullName,
        email: formData.email || null,
        password: formData.password,
        isAdmin: formData.isAdmin,
        isActive: formData.isActive,
        role: formData.role,
        permissions: formData.permissions
      })

      toast.success(t('success.createSuccess'))
      setOpen(false)
      setFormData({
        username: '',
        fullName: '',
        email: null,
        password: '',
        confirmPassword: '',
        isAdmin: false,
        isActive: true,
        role: 'custom',
        permissions: getEmptyPermissions()
      })
      onSuccess()
    } catch (error) {
      if ((error as Error).message === 'USERNAME_EXISTS') {
        toast.error(t('errors.usernameExists'))
      } else {
        toast.error(t('errors.createFailed'))
      }
      console.error('Failed to create account:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" variant="secondary">
          <Plus className="h-4 w-4" />
          {t('addNew')}
        </Button>
      </DialogTrigger>
      <DialogContent
        className={`bg-gray-900 border-gray-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto ${isRTL ? 'rtl' : ''}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <DialogHeader className={isRTL ? 'text-right' : ''}>
          <DialogTitle>{t('addNew')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white border-b border-gray-700 pb-2">
                {t('basicInfo')}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">
                    {t('form.username')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder={t('form.username')}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    {t('form.fullName')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder={t('form.fullName')}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('form.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value || null })}
                  placeholder={t('form.email')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">
                    {t('form.password')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={t('form.password')}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    {t('form.confirmPassword')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder={t('form.confirmPassword')}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked as boolean })
                  }
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  {t('form.isActive')}
                </Label>
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white border-b border-gray-700 pb-2">
                {t('form.roleAndPermissions')}
              </h3>
              <RoleSelector
                role={formData.role}
                onChange={handleRoleChange}
                disableAdminRole={!canManageAdmin}
              />
            </div>

            {/* Permissions - Always show, but read-only for non-custom roles or without permission */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white border-b border-gray-700 pb-2">
                {t('form.permissions')}
              </h3>
              {formData.role !== 'custom' && (
                <p className="text-sm text-gray-400">{t('form.rolePermissionsReadOnly')}</p>
              )}
              {formData.role === 'custom' && !canManagePermissions && (
                <p className="text-sm text-yellow-400">
                  {t('form.noPermissionToManagePermissions')}
                </p>
              )}
              {formData.role === 'custom' && canManagePermissions && (
                <p className="text-sm text-gray-400">{t('form.customPermissionsDescription')}</p>
              )}
              <PermissionsSelector
                permissions={formData.permissions || {}}
                onChange={handlePermissionsChange}
                disabled={formData.role !== 'custom' || !canManagePermissions}
              />
            </div>
          </div>
          <DialogFooter className={`mt-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button type="button" variant="primary" onClick={() => setOpen(false)}>
              {t('form.cancel')}
            </Button>
            <Button type="submit" variant="secondary" disabled={loading}>
              {loading && <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />}
              {t('form.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
