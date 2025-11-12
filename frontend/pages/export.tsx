import { useQuery } from '@tanstack/react-query'
import {
  Button,
  Container,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { Layout } from '../src/components/Layout'
import api from '../src/lib/api'
import { Table, View } from '../src/types'

interface ListResponse<T> {
  results?: T[]
}

const downloadFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export default function ExportPage() {
  const tablesQuery = useQuery(['tables'], async () => {
    const response = await api.get<ListResponse<Table>>('/tables/')
    return Array.isArray(response.data) ? response.data : response.data.results ?? []
  })
  const [tableId, setTableId] = useState<number | ''>('')
  const viewsQuery = useQuery(['views', tableId], async () => {
    if (!tableId) return []
    const response = await api.get<ListResponse<View>>('/views/', { params: { table: tableId } })
    return Array.isArray(response.data) ? response.data : response.data.results ?? []
  }, { enabled: Boolean(tableId) })
  const [viewId, setViewId] = useState<number | ''>('')

  const handleExport = async () => {
    if (!tableId) return
    const params: Record<string, any> = {}
    if (viewId) {
      const view = viewsQuery.data?.find((item) => item.id === viewId)
      if (view?.config?.sort?.length) params.sort = view.config.sort.join(',')
      if (view?.config?.filter?.length) params.filter = view.config.filter.join(',')
    }
    const response = await api.get(`/tables/${tableId}/records`, { params })
    const data = Array.isArray(response.data) ? response.data : response.data.results ?? []
    downloadFile('export.json', JSON.stringify(data, null, 2))
  }

  return (
    <Layout>
      <Container maxWidth="md">
        <Typography variant="h5" mb={2}>
          Export Records
        </Typography>
        <Stack spacing={2}>
          <TextField
            select
            label="Table"
            value={tableId}
            onChange={(e) => setTableId(Number(e.target.value))}
          >
            {tablesQuery.data?.map((table) => (
              <MenuItem key={table.id} value={table.id}>
                {table.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="View (optional)"
            value={viewId}
            onChange={(e) => setViewId(Number(e.target.value))}
            disabled={!tableId}
          >
            <MenuItem value="">Default</MenuItem>
            {viewsQuery.data?.map((view) => (
              <MenuItem key={view.id} value={view.id}>
                {view.name}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="contained" onClick={handleExport}>
            Download JSON
          </Button>
        </Stack>
      </Container>
    </Layout>
  )
}
