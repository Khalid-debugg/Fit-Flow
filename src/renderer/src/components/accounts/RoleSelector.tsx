import { useTranslation } from 'react-i18next'
import { Label } from '@renderer/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { UserRole } from '@renderer/models/account'

interface RoleSelectorProps {
  role: UserRole
  onChange: (role: UserRole) => void
  disabled?: boolean
  disableAdminRole?: boolean
}

export default function RoleSelector({
  role,
  onChange,
  disabled = false,
  disableAdminRole = false
}: RoleSelectorProps) {
  const { t } = useTranslation('accounts')
  const allRoles: UserRole[] = ['admin', 'manager', 'coach', 'receptionist', 'custom']
  // Filter out admin role if user doesn't have permission to manage it
  const roles = disableAdminRole ? allRoles.filter((r) => r !== 'admin') : allRoles

  return (
    <div className="space-y-2">
      <Label>{t('form.role')}</Label>
      <Select
        value={role}
        onValueChange={(value) => onChange(value as UserRole)}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t('form.selectRole')} />
        </SelectTrigger>
        <SelectContent>
          {roles.map((roleOption) => (
            <SelectItem key={roleOption} value={roleOption}>
              <div className="flex flex-col">
                <span className="font-medium">{t(`roles.${roleOption}.label`)}</span>
                <span className="text-xs text-gray-400">
                  {t(`roles.${roleOption}.description`)}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-gray-400">
        {role === 'custom' ? t('form.roleCustomHint') : t('form.roleAutoHint')}
      </p>
    </div>
  )
}
