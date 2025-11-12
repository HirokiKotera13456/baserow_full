import { useQuery } from '@tanstack/react-query'
import {
  Button,
  Container,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { ChangeEvent, useState } from 'react'
import { Layout } from '../src/components/Layout'
import api from '../src/lib/api'
import { Table } from '../src/types'
import { useSnackbar } from '../src/context/SnackbarContext'

interface ListResponse<T> {
  results?: T[]
}

const parseCsv = (content: string) => {
  const [headerLine, ...rows] = content.trim().split(/\r?\n/)
  const headers = headerLine.split(',').map((h) => h.trim())
  return rows.map((row) => {
    const values = row.split(',')
    const record: Record<string, any> = {}
    headers.forEach((header, index) => {
      record[header] = values[index]
    })
    return record
  })
}

export default function ImportPage() {
  const { openSnackbar } = useSnackbar()
  const [tableId, setTableId] = useState<number | ''>('')
  const [data, setData] = useState('')

  const tablesQuery = useQuery(['tables'], async () => {
    const response = await api.get<ListResponse<Table>>('/tables/')
    return Array.isArray(response.data) ? response.data : response.data.results ?? []
  })

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const content = await file.text()
    if (file.name.endsWith('.csv')) {
      const parsed = parseCsv(content)
      setData(JSON.stringify(parsed, null, 2))
    } else {
      setData(content)
    }
  }

  const handleImport = async () => {
    if (!tableId) {
      openSnackbar('Table is required', 'warning')
      return
    }
    let records: any[] = []
    try {
      records = JSON.parse(data)
    } catch (error) {
      openSnackbar('Invalid JSON payload', 'error')
      return
    }
    for (const record of records) {
      await api.post(`/tables/${tableId}/records`, { data: record })
    }
    openSnackbar(`Imported ${records.length} records`, 'success')
    setData('')
  }

  return (
    <Layout>
      <Container maxWidth="md">
        <Typography variant="h5" mb={2}>
          Import Records
        </Typography>
        <Stack spacing={2}>
          <TextField
            select
            label="Target Table"
            value={tableId}
            onChange={(e) => setTableId(Number(e.target.value))}
          >
            {tablesQuery.data?.map((table) => (
              <MenuItem key={table.id} value={table.id}>
                {table.name}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="outlined" component="label">
            Upload CSV/JSON
            <input type="file" hidden accept=".csv,.json" onChange={handleFileUpload} />
          </Button>
          <TextField
            label="JSON Payload"
            multiline
            minRows={10}
            value={data}
            onChange={(e) => setData(e.target.value)}
          />
          <Button variant="contained" onClick={handleImport}>
            Import
          </Button>
        </Stack>
      </Container>
    </Layout>
  )
}
