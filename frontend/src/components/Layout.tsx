import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material'
import Link from 'next/link'
import { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'

export const Layout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Generic DB UI
          </Typography>
          <Button color="inherit" component={Link} href="/workspaces">
            Workspaces
          </Button>
          <Button color="inherit" component={Link} href="/import">
            Import
          </Button>
          <Button color="inherit" component={Link} href="/export">
            Export
          </Button>
          {user ? (
            <Button color="inherit" onClick={logout} data-testid="logout-button">
              Logout ({user.username})
            </Button>
          ) : (
            <Button color="inherit" component={Link} href="/login">
              Login
            </Button>
          )}
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>{children}</Box>
    </Box>
  )
}
