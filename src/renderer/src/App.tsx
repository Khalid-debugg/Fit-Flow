import { useState } from 'react'

function App(): React.JSX.Element {
  const [message, setMessage] = useState('')

  const testIPC = async (): Promise<void> => {
    const result = await window.electron.ipcRenderer.invoke('ping')
    setMessage(result)
  }

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>FitFlow - Gym Management</h1>
      <button onClick={testIPC}>Test IPC</button>
      <p>{message}</p>
    </div>
  )
}

export default App
