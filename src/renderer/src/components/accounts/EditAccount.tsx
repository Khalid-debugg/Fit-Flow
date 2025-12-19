import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  User,
  UserRole,
  getAllPermissionsEnabled,
  getPermissionsForRole,
  detectRoleFromPermissions,
  PERMISSIONS
} from '@renderer/models/account'
import PermissionsSelector from './PermissionsSelector'
import RoleSelector from './RoleSelector'
import { useAuth } from '@renderer/hooks/useAuth'

interface EditAccountProps {
  user: User | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function EditAccount({ user, open, onClose, onSuccess }: EditAccountProps) {
  const { t, i18n } = useTranslation('accounts')
  const { hasPermission } = useAuth()
  const [loading, setLoading] = useState(false)
  const isRTL = i18n.language === 'ar'
  const [formData, setFormData] = useState<Partial<User> & { role: UserRole }>({
    role: 'receptionist'
  })
  const [changePassword, setChangePassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Check permissions
  const canChangePassword = hasPermission(PERMISSIONS.accounts.change_password)
  const canManageAdmin = hasPermission(PERMISSIONS.accounts.manage_admin)
  const canManagePermissions = hasPermission(PERMISSIONS.accounts.manage_permissions)

  useEffect(() => {
    if (user) {
      // Determine role based on user data
      let role: UserRole = user.role || 'custom'
      // If no role is set, try to determine from isAdmin
      if (!user.role) {
        role = user.isAdmin ? 'admin' : 'custom'
      }

      setFormData({
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        isAdmin: user.isAdmin,
        isActive: user.isActive,
        role,
        permissions: user.permissions
      })
      // Reset password fields when user changes
      setChangePassword(false)
      setNewPassword('')
      setConfirmPassword('')
    }
  }, [user])

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

    if (!user?.id) return

    if (!formData.username || !formData.fullName) {
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

    // Validate password if changing
    if (changePassword) {
      if (!newPassword) {
        toast.error(t('errors.passwordRequired'))
        return
      }
      if (newPassword.length < 4) {
        toast.error(t('errors.passwordTooShort'))
        return
      }
      if (newPassword !== confirmPassword) {
        toast.error(t('errors.passwordMismatch'))
        return
      }
    }

    setLoading(true)
    try {
      const updateData: User = {
        username: formData.username,
        fullName: formData.fullName,
        email: formData.email || null,
        isAdmin: formData.isAdmin!,
        isActive: formData.isActive!,
        role: formData.role,
        permissions: formData.permissions!
      }

      // Include password only if changing
      if (changePassword && newPassword) {
        updateData.password = newPassword
      }

      await window.electron.ipcRenderer.invoke('accounts:update', user.id, updateData)

      toast.success(t('success.updateSuccess'))
      onClose()
      onSuccess()
    } catch (error) {
      if ((error as Error).message === 'USERNAME_EXISTS') {
        toast.error(t('errors.usernameExists'))
      } else {
        toast.error(t('errors.updateFailed'))
      }
      console.error('Failed to update account:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={`bg-gray-900 border-gray-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto ${isRTL ? 'rtl' : ''}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <DialogHeader className={isRTL ? 'text-right' : ''}>
          <DialogTitle>{t('editAccount')}</DialogTitle>
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
                  <Label htmlFor="edit-username">
                    {t('form.username')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-username"
                    value={formData.username || ''}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder={t('form.username')}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-fullName">
                    {t('form.fullName')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-fullName"
                    value={formData.fullName || ''}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder={t('form.fullName')}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">{t('form.email')}</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value || null })}
                  placeholder={t('form.email')}
                />
              </div>

              {canChangePassword && (
                <>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="edit-changePassword"
                      checked={changePassword}
                      onCheckedChange={(checked) => {
                        setChangePassword(checked as boolean)
                        if (!checked) {
                          setNewPassword('')
                          setConfirmPassword('')
                        }
                      }}
                    />
                    <Label htmlFor="edit-changePassword" className="cursor-pointer">
                      {t('form.changePassword')}
                    </Label>
                  </div>

                  {changePassword && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-newPassword">
                          {t('form.newPassword')} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="edit-newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder={t('form.newPassword')}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-confirmPassword">
                          {t('form.confirmPassword')} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="edit-confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder={t('form.confirmPassword')}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked as boolean })
                  }
                />
                <Label htmlFor="edit-isActive" className="cursor-pointer">
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
            <Button type="button" variant="primary" onClick={onClose}>
              {t('form.cancel')}
            </Button>
            <Button type="submit" variant="secondary" disabled={loading}>
              {loading && <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />}
              {t('form.update')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
