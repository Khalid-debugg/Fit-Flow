/* eslint-disable @typescript-eslint/no-explicit-any */
export {}

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        invoke(channel: string, ...args: any[]): Promise<any>
        send(channel: string, ...args: any[]): void
        on(channel: string, listener: (...args: any[]) => void): void
        once(channel: string, listener: (...args: any[]) => void): void
        removeListener(channel: string, listener: (...args: any[]) => void): void
      }
    }
  }
}
