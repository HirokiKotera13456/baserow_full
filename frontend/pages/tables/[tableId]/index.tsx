import { useRouter } from 'next/router'
import { useQuery } from '@tanstack/react-query'
import { Container, Typography } from '@mui/material'
import { Layout } from '../../../src/components/Layout'
import api from '../../../src/lib/api'
import { Table } from '../../../src/types'
import { DataGridView } from '../../../src/components/DataGridView'

export default function TableRecordsPage() {
  const router = useRouter()
  const { tableId } = router.query
  const id = Number(tableId)

  const tableQuery = useQuery(['table', id], async () => {
    if (!id) return null
    const response = await api.get<Table>(`/tables/${id}/`)
    return response.data
  }, { enabled: Boolean(id) })

  if (!id || !tableQuery.data) {
    return null
  }

  const workspaceId = tableQuery.data.workspace_id

  return (
    <Layout>
      <Container maxWidth="xl">
        <Typography variant="h5" mb={2}>
          {tableQuery.data.name}
        </Typography>
        <DataGridView tableId={id} workspaceId={Number(workspaceId)} />
      </Container>
    </Layout>
  )
}
