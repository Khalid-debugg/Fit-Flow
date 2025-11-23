import { useState } from 'react'

function Versions(): React.JSX.Element {
  const [versions] = useState((window.electron as any).process?.versions || {})

  return (
    <ul className="versions">
      <li className="electron-version">Electron v{versions.electron || 'N/A'}</li>
      <li className="chrome-version">Chromium v{versions.chrome || 'N/A'}</li>
      <li className="node-version">Node v{versions.node || 'N/A'}</li>
    </ul>
  )
}

export default Versions
