import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '../ui/dialog'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { toast } from 'sonner'

interface LicenseActivationProps {
  open: boolean
  onActivated: () => void
}

export function LicenseActivation({ open, onActivated }: LicenseActivationProps) {
  const [hardwareId, setHardwareId] = useState<string>('')
  const [licenseKey, setLicenseKey] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingHwid, setIsFetchingHwid] = useState(true)

  useEffect(() => {
    if (open) {
      fetchHardwareId()
    }
  }, [open])

  const fetchHardwareId = async (): Promise<void> => {
    setIsFetchingHwid(true)
    try {
      const result = await window.api.license.getHardwareId()
      if (result.success && result.formatted) {
        setHardwareId(result.formatted)
      } else {
        toast.error('Failed to get hardware ID')
      }
    } catch (error) {
      console.error('Error fetching hardware ID:', error)
      toast.error('Failed to get hardware ID')
    } finally {
      setIsFetchingHwid(false)
    }
  }

  const handleActivate = async (): Promise<void> => {
    if (!licenseKey.trim()) {
      toast.error('Please enter a license key')
      return
    }

    setIsLoading(true)
    try {
      const result = await window.api.license.activate(licenseKey.trim())

      if (result.success) {
        toast.success('License activated successfully!')
        onActivated()
      } else {
        toast.error(result.message || 'Invalid license key')
      }
    } catch (error) {
      console.error('Error activating license:', error)
      toast.error('Failed to activate license')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (): void => {
    navigator.clipboard.writeText(hardwareId)
    toast.success('Hardware ID copied to clipboard!')
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="bg-gray-900 border-gray-700 text-white max-w-[500px]"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>Activate FitFlow</DialogTitle>
          <DialogDescription className="text-gray-300">
            This application requires activation. Please contact the administrator with your
            Hardware ID to receive a license key.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Hardware ID Display */}
          <div className="space-y-2">
            <Label htmlFor="hwid">Your Hardware ID</Label>
            <div className="flex gap-2">
              <Input
                id="hwid"
                value={isFetchingHwid ? 'Loading...' : hardwareId}
                readOnly
                className="font-mono text-sm bg-gray-800 border-gray-600 text-white"
              />
              <Button onClick={copyToClipboard} variant="outline" disabled={isFetchingHwid}>
                Copy
              </Button>
            </div>
            <p className="text-xs text-gray-400">Send this Hardware ID to get your license key</p>
          </div>

          {/* License Key Input */}
          <div className="space-y-2">
            <Label htmlFor="license">License Key</Label>
            <Input
              id="license"
              placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              className="font-mono text-sm bg-gray-800 border-gray-600 text-white"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-400">
              Enter the license key provided by the administrator
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={handleActivate} disabled={isLoading || !licenseKey.trim()}>
            {isLoading ? 'Activating...' : 'Activate'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
