import { useRouter } from 'next/router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Card,
  CardActions,
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
import { Database, Table } from '../../src/types'
import { useSnackbar } from '../../src/context/SnackbarContext'

interface ListResponse<T> {
  results?: T[]
}

export default function DatabaseDetailPage() {
  const router = useRouter()
  const { dbId } = router.query
  const databaseId = Number(dbId)
  const queryClient = useQueryClient()
  const { openSnackbar } = useSnackbar()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')

  const databaseQuery = useQuery(['database', databaseId], async () => {
    if (!databaseId) return null
    const response = await api.get<Database>(`/databases/${databaseId}/`)
    return response.data
  }, { enabled: Boolean(databaseId) })

  const tablesQuery = useQuery(['tables', databaseId], async () => {
    if (!databaseId) return []
    const response = await api.get<ListResponse<Table>>('/tables/', { params: { database: databaseId } })
    return Array.isArray(response.data) ? response.data : response.data.results ?? []
  }, { enabled: Boolean(databaseId) })

  const handleCreate = async () => {
    await api.post('/tables/', { name, database: databaseId })
    await queryClient.invalidateQueries({ queryKey: ['tables', databaseId] })
    setOpen(false)
    setName('')
    openSnackbar('Table created', 'success')
  }

  const handleDelete = async (tableId: number) => {
    await api.delete(`/tables/${tableId}/`)
    await queryClient.invalidateQueries({ queryKey: ['tables', databaseId] })
    openSnackbar('Table archived', 'success')
  }

  return (
    <Layout>
      <Container maxWidth="lg">
        <Stack direction="row" justifyContent="space-between" mb={3} alignItems="center">
          <Typography variant="h5">{databaseQuery.data?.name ?? 'Database'}</Typography>
          <Button variant="contained" onClick={() => setOpen(true)}>
            New Table
          </Button>
        </Stack>
        <Grid container spacing={2}>
          {tablesQuery.data?.map((table) => (
            <Grid item xs={12} md={4} key={table.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{table.name}</Typography>
                  {table.deleted_at && (
                    <Typography variant="caption" color="error">
                      Archived
                    </Typography>
                  )}
                </CardContent>
                <CardActions>
                  <Button component={Link} href={`/tables/${table.id}`} size="small">
                    Records
                  </Button>
                  <Button component={Link} href={`/tables/${table.id}/schema`} size="small">
                    Schema
                  </Button>
                  <Button component={Link} href={`/tables/${table.id}/views`} size="small">
                    Views
                  </Button>
                  <Button size="small" color="error" onClick={() => handleDelete(table.id)}>
                    Archive
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>New Table</DialogTitle>
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
