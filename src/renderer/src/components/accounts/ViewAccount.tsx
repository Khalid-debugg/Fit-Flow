import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@renderer/components/ui/dialog'
import { User, PERMISSIONS, PERMISSION_LABELS, PAGE_NAMES } from '@renderer/models/account'
import { format } from 'date-fns'
import {
  Shield,
  ShieldOff,
  Mail,
  Calendar,
  Check,
  X,
  BadgeCheck,
  LucideIcon,
  User as UserIcon
} from 'lucide-react'

interface ViewAccountProps {
  user: User | null
  open: boolean
  onClose: () => void
}

export default function ViewAccount({ user, open, onClose }: ViewAccountProps) {
  const { t } = useTranslation('accounts')
  if (!user) return null

  const InfoRow = ({
    icon: Icon,
    label,
    value
  }: {
    icon: LucideIcon
    label: string
    value: string | number | null
  }) => (
    <div className="flex items-start gap-3 bg-gray-800/40 rounded-xl p-3 hover:bg-gray-800/70 transition-colors">
      <div className="w-8 h-8 bg-gray-700/60 flex items-center justify-center rounded-lg">
        <Icon className="w-4 h-4 text-gray-300" />
      </div>
      <div>
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-white">
          {value || <span className="text-gray-500">-</span>}
        </p>
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border border-gray-700 text-white max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <UserIcon className="w-6 h-6 text-blue-400" />
            {user.username}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-8">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-blue-400 flex items-center gap-2">
              <BadgeCheck className="w-5 h-5" />
              {t('basicInfo')}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow icon={UserIcon} label={t('username')} value={user.username} />
              <InfoRow icon={UserIcon} label={t('fullName')} value={user.fullName} />
              <InfoRow icon={Mail} label={t('email')} value={user.email} />
              <InfoRow
                icon={Calendar}
                label={t('createdAt')}
                value={
                  user.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy HH:mm') : '-'
                }
              />
              <InfoRow
                icon={Calendar}
                label={t('lastLogin')}
                value={
                  user.lastLogin
                    ? format(new Date(user.lastLogin), 'MMM dd, yyyy HH:mm')
                    : t('never')
                }
              />
              <div className="col-span-2 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{t('role')}:</span>
                  {user.isAdmin ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      <Shield className="h-3 w-3 mr-1" />
                      {t('administrator')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
                      <ShieldOff className="h-3 w-3 mr-1" />
                      {t('user')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{t('status')}:</span>
                  {user.isActive ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                      {t('active')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                      {t('inactive')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Permissions */}
          {!user.isAdmin && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-blue-400 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                {t('permissions.title')}
              </h3>

              <div className="space-y-3">
                {Object.entries(PERMISSIONS).map(([page, pagePermissions]) => {
                  const hasAnyPermission = Object.values(pagePermissions).some(
                    (permission) => user.permissions[permission] === true
                  )

                  if (!hasAnyPermission) return null

                  return (
                    <div
                      key={page}
                      className="bg-gray-800/40 border border-gray-700 rounded-xl p-4 space-y-3"
                    >
                      <h4 className="text-sm font-semibold text-white">{PAGE_NAMES[page]}</h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {Object.entries(pagePermissions).map(([, permission]) => {
                          const hasPermission = user.permissions[permission] === true

                          return (
                            <div
                              key={permission}
                              className={`flex items-center gap-2 ${hasPermission ? 'text-green-400' : 'text-gray-500'}`}
                            >
                              {hasPermission ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                              <span className="text-sm">{PERMISSION_LABELS[permission]}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {user.isAdmin && (
            <div className="bg-purple-900/20 border border-purple-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-purple-300">
                <Shield className="h-5 w-5" />
                <span className="font-medium">{t('permissions.adminFullAccess')}</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
