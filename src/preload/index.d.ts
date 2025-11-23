import { ElectronAPI } from '@electron-toolkit/preload'

interface LicenseAPI {
  getHardwareId: () => Promise<{
    success: boolean
    hardwareId?: string
    formatted?: string
    error?: string
  }>
  isLicensed: () => Promise<boolean>
  activate: (licenseKey: string) => Promise<{
    success: boolean
    message: string
  }>
  getStatus: () => Promise<{
    isLicensed: boolean
    hardwareId?: string
    formattedHardwareId?: string
    hasLicenseFile?: boolean
    error?: string
  }>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      license: LicenseAPI
    }
  }
}
