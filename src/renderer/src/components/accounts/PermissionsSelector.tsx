import { useTranslation } from 'react-i18next'
import { Checkbox } from '@renderer/components/ui/checkbox'
import {
  PERMISSIONS,
  UserPermissions,
  resolvePermissionDependencies,
  isPermissionRequired
} from '@renderer/models/account'

interface PermissionsSelectorProps {
  permissions: UserPermissions
  onChange: (permissions: UserPermissions) => void
  disabled?: boolean
}

export default function PermissionsSelector({
  permissions,
  onChange,
  disabled = false
}: PermissionsSelectorProps) {
  const { t } = useTranslation('accounts')

  const handlePermissionChange = (permission: string, checked: boolean) => {
    // Resolve dependencies when changing permissions
    const resolvedPermissions = resolvePermissionDependencies(permissions, permission, checked)

    // Apply the changed permission
    onChange({
      ...resolvedPermissions,
      [permission]: checked
    })
  }

  const handlePageToggle = (page: string, checked: boolean) => {
    const pagePermissions = PERMISSIONS[page as keyof typeof PERMISSIONS]
    let newPermissions = { ...permissions }

    // Apply the change to all permissions in the page
    Object.values(pagePermissions).forEach((permission) => {
      newPermissions[permission] = checked
    })

    // If enabling permissions, resolve dependencies for each permission
    if (checked) {
      Object.values(pagePermissions).forEach((permission) => {
        newPermissions = resolvePermissionDependencies(newPermissions, permission, true)
      })
    } else {
      // If disabling, need to cascade the disable to dependent permissions
      Object.values(pagePermissions).forEach((permission) => {
        newPermissions = resolvePermissionDependencies(newPermissions, permission, false)
      })
    }

    onChange(newPermissions)
  }

  const isPageFullyChecked = (page: string): boolean => {
    const pagePermissions = PERMISSIONS[page as keyof typeof PERMISSIONS]
    return Object.values(pagePermissions).every((permission) => permissions[permission] === true)
  }

  const isPagePartiallyChecked = (page: string): boolean => {
    const pagePermissions = PERMISSIONS[page as keyof typeof PERMISSIONS]
    const checkedCount = Object.values(pagePermissions).filter(
      (permission) => permissions[permission] === true
    ).length
    return checkedCount > 0 && checkedCount < Object.values(pagePermissions).length
  }

  return (
    <div className="space-y-6">
      {Object.entries(PERMISSIONS).map(([page, pagePermissions]) => {
        const isFullyChecked = isPageFullyChecked(page)
        const isPartiallyChecked = isPagePartiallyChecked(page)

        return (
          <div key={page} className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-3">
            {/* Page Header with Toggle All */}
            <div className="flex items-center gap-3 pb-2 border-b border-gray-700">
              <Checkbox
                id={`page-${page}`}
                checked={isFullyChecked}
                onCheckedChange={(checked) => handlePageToggle(page, checked as boolean)}
                disabled={disabled}
                className={
                  isPartiallyChecked && !isFullyChecked ? 'data-[state=checked]:bg-yellow-600' : ''
                }
              />
              <label
                htmlFor={`page-${page}`}
                className="text-sm font-semibold text-white cursor-pointer flex-1"
              >
                {t(`pages.${page}`)}
                <span className="text-xs text-gray-400 ltr:ml-2 rtl:mr-2">
                  ({Object.keys(pagePermissions).length} {t('permissionsCount')})
                </span>
              </label>
            </div>

            {/* Individual Permissions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ltr:pl-6 rtl:pr-6">
              {Object.entries(pagePermissions).map(([, permission]) => {
                const isRequired = isPermissionRequired(permission, permissions)
                const isDisabled = disabled || isRequired

                return (
                  <div key={permission} className="flex items-center gap-2">
                    <Checkbox
                      id={permission}
                      checked={permissions[permission] === true}
                      onCheckedChange={(checked) =>
                        handlePermissionChange(permission, checked as boolean)
                      }
                      disabled={isDisabled}
                    />
                    <label
                      htmlFor={permission}
                      className={`text-sm cursor-pointer ${
                        isRequired ? 'text-blue-400' : 'text-gray-300'
                      }`}
                      title={isRequired ? t('requiredByOtherPermissions') : undefined}
                    >
                      {t(`permissionLabels.${permission}`)}
                      {isRequired && (
                        <span className="ltr:ml-1 rtl:mr-1 text-xs text-blue-500">*</span>
                      )}
                    </label>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
