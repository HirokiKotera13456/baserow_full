import { useRouter } from 'next/router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
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
import { Database, Workspace } from '../../src/types'
import { useSnackbar } from '../../src/context/SnackbarContext'

interface ListResponse<T> {
  results?: T[]
}

export default function WorkspaceDetailPage() {
  const router = useRouter()
  const { wsId } = router.query
  const workspaceId = Number(wsId)
  const queryClient = useQueryClient()
  const { openSnackbar } = useSnackbar()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')

  const workspaceQuery = useQuery(['workspace', workspaceId], async () => {
    if (!workspaceId) return null
    const response = await api.get<Workspace>(`/workspaces/${workspaceId}/`)
    return response.data
  }, { enabled: Boolean(workspaceId) })

  const databasesQuery = useQuery(['databases', workspaceId], async () => {
    if (!workspaceId) return []
    const response = await api.get<ListResponse<Database>>('/databases/', { params: { workspace: workspaceId } })
    return Array.isArray(response.data) ? response.data : response.data.results ?? []
  }, { enabled: Boolean(workspaceId) })

  const handleCreate = async () => {
    await api.post('/databases/', { name, workspace: workspaceId })
    await queryClient.invalidateQueries({ queryKey: ['databases', workspaceId] })
    setOpen(false)
    setName('')
    openSnackbar('Database created', 'success')
  }

  return (
    <Layout>
      <Container maxWidth="lg">
        <Stack direction="row" justifyContent="space-between" mb={3} alignItems="center">
          <Typography variant="h5">{workspaceQuery.data?.name ?? 'Workspace'}</Typography>
          <Button variant="contained" onClick={() => setOpen(true)}>
            New Database
          </Button>
        </Stack>
        <Grid container spacing={2}>
          {databasesQuery.data?.map((database) => (
            <Grid item xs={12} md={4} key={database.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{database.name}</Typography>
                  <Button component={Link} href={`/databases/${database.id}`} sx={{ mt: 2 }} variant="outlined">
                    View Tables
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>New Database</DialogTitle>
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
