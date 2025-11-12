import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import Link from 'next/link'
import { useState } from 'react'
import { Layout } from '../../src/components/Layout'
import api from '../../src/lib/api'
import { Workspace } from '../../src/types'
import { useSnackbar } from '../../src/context/SnackbarContext'

interface ListResponse<T> {
  results?: T[]
}

export default function WorkspaceListPage() {
  const queryClient = useQueryClient()
  const { openSnackbar } = useSnackbar()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')

  const workspacesQuery = useQuery(['workspaces'], async () => {
    const response = await api.get<ListResponse<Workspace>>('/workspaces/')
    return Array.isArray(response.data) ? response.data : response.data.results ?? []
  })

  const handleCreate = async () => {
    await api.post('/workspaces/', { name })
    await queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    setOpen(false)
    setName('')
    openSnackbar('Workspace created', 'success')
  }

  return (
    <Layout>
      <Container maxWidth="lg">
        <Stack direction="row" justifyContent="space-between" mb={3} alignItems="center">
          <Typography variant="h5">Workspaces</Typography>
          <Button variant="contained" onClick={() => setOpen(true)}>
            New Workspace
          </Button>
        </Stack>
        <Grid container spacing={2}>
          {workspacesQuery.data?.map((workspace) => (
            <Grid item xs={12} md={4} key={workspace.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{workspace.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Owner: {workspace.owner.username}
                  </Typography>
                  <Box mt={2}>
                    <Button component={Link} href={`/workspaces/${workspace.id}`} variant="outlined">
                      View Databases
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>New Workspace</DialogTitle>
        <DialogContent>
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} sx={{ mt: 1 }} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  )
}
