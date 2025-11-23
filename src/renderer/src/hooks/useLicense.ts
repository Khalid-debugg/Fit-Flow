import { useState, useEffect } from 'react'

interface UseLicenseReturn {
  isLicensed: boolean
  isCheckingLicense: boolean
  setIsLicensed: (licensed: boolean) => void
}

export function useLicense(): UseLicenseReturn {
  const [isLicensed, setIsLicensed] = useState<boolean>(false)
  const [isCheckingLicense, setIsCheckingLicense] = useState<boolean>(true)

  useEffect(() => {
    checkLicense()
  }, [])

  const checkLicense = async (): Promise<void> => {
    try {
      const licensed = await window.api.license.isLicensed()
      setIsLicensed(licensed)
    } catch (error) {
      console.error('Error checking license:', error)
      setIsLicensed(false)
    } finally {
      setIsCheckingLicense(false)
    }
  }

  return {
    isLicensed,
    isCheckingLicense,
    setIsLicensed
  }
}
