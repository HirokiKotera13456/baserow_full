import { useRouter } from 'next/router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Container,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { Layout } from '../../../src/components/Layout'
import api from '../../../src/lib/api'
import { Table, View } from '../../../src/types'
import { useSnackbar } from '../../../src/context/SnackbarContext'

interface ListResponse<T> {
  results?: T[]
}

export default function TableViewsPage() {
  const router = useRouter()
  const { tableId } = router.query
  const id = Number(tableId)
  const queryClient = useQueryClient()
  const { openSnackbar } = useSnackbar()
  const [name, setName] = useState('')

  const tableQuery = useQuery(['table', id], async () => {
    if (!id) return null
    const response = await api.get<Table>(`/tables/${id}/`)
    return response.data
  }, { enabled: Boolean(id) })

  const viewsQuery = useQuery(['views', id], async () => {
    if (!id) return []
    const response = await api.get<ListResponse<View>>('/views/', { params: { table: id } })
    return Array.isArray(response.data) ? response.data : response.data.results ?? []
  }, { enabled: Boolean(id) })

  const handleCreate = async () => {
    await api.post('/views/', { table: id, name: name || 'New View', config: {} })
    await queryClient.invalidateQueries({ queryKey: ['views', id] })
    setName('')
    openSnackbar('View created', 'success')
  }

  const handleDelete = async (viewId: number) => {
    await api.delete(`/views/${viewId}/`)
    await queryClient.invalidateQueries({ queryKey: ['views', id] })
    openSnackbar('View deleted', 'success')
  }

  if (!id || !tableQuery.data) {
    return null
  }

  return (
    <Layout>
      <Container maxWidth="md">
        <Typography variant="h5" mb={2}>
          {tableQuery.data.name} Views
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
          <TextField label="View Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Button variant="contained" onClick={handleCreate}>
            Create
          </Button>
        </Stack>
        <List>
          {viewsQuery.data?.map((view) => (
            <ListItem
              key={view.id}
              secondaryAction={
                <Button color="error" onClick={() => handleDelete(view.id)}>
                  Delete
                </Button>
              }
            >
              <ListItemText primary={view.name} secondary={JSON.stringify(view.config)} />
            </ListItem>
          ))}
        </List>
      </Container>
    </Layout>
  )
}
