import { createContext, ReactNode, useContext, useMemo, useState } from 'react'
import { Alert, Snackbar } from '@mui/material'

type Severity = 'success' | 'info' | 'warning' | 'error'

interface SnackbarState {
  openSnackbar: (message: string, severity?: Severity) => void
}

const SnackbarContext = createContext<SnackbarState | undefined>(undefined)

export const SnackbarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<{ open: boolean; message: string; severity: Severity }>({
    open: false,
    message: '',
    severity: 'info',
  })

  const openSnackbar = (message: string, severity: Severity = 'info') => {
    setState({ open: true, message, severity })
  }

  const handleClose = () => setState((prev) => ({ ...prev, open: false }))

  const value = useMemo(() => ({ openSnackbar }), [])

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar open={state.open} autoHideDuration={4000} onClose={handleClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={state.severity} onClose={handleClose} variant="filled">
          {state.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  )
}

export const useSnackbar = () => {
  const ctx = useContext(SnackbarContext)
  if (!ctx) {
    throw new Error('useSnackbar must be used within SnackbarProvider')
  }
  return ctx
}
