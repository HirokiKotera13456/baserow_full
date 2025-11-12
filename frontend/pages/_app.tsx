import { CacheProvider, EmotionCache } from '@emotion/react'
import createCache from '@emotion/cache'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { AppProps } from 'next/app'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { AuthProvider } from '../src/context/AuthContext'
import { SnackbarProvider } from '../src/context/SnackbarContext'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'

type EnhancedAppProps = AppProps & { emotionCache?: EmotionCache }

const clientSideEmotionCache = createCache({ key: 'css', prepend: true })

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
  },
})

export default function App({ Component, pageProps, emotionCache = clientSideEmotionCache }: EnhancedAppProps) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <CacheProvider value={emotionCache}>
      <QueryClientProvider client={queryClient}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
              <SnackbarProvider>
                <Component {...pageProps} />
              </SnackbarProvider>
            </AuthProvider>
          </ThemeProvider>
        </LocalizationProvider>
      </QueryClientProvider>
    </CacheProvider>
  )
}
