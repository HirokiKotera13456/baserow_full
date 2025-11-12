import { useRouter } from 'next/router'
import { useQuery } from '@tanstack/react-query'
import { Container, Typography } from '@mui/material'
import { Layout } from '../../../src/components/Layout'
import api from '../../../src/lib/api'
import { Field, Table } from '../../../src/types'
import { SchemaEditor } from '../../../src/components/SchemaEditor'

interface ListResponse<T> {
  results?: T[]
}

export default function TableSchemaPage() {
  const router = useRouter()
  const { tableId } = router.query
  const id = Number(tableId)

  const tableQuery = useQuery(['table', id], async () => {
    if (!id) return null
    const response = await api.get<Table>(`/tables/${id}/`)
    return response.data
  }, { enabled: Boolean(id) })

  const fieldsQuery = useQuery(['fields', id], async () => {
    if (!id) return []
    const response = await api.get<ListResponse<Field>>('/fields/', { params: { table: id } })
    return Array.isArray(response.data) ? response.data : response.data.results ?? []
  }, { enabled: Boolean(id) })

  if (!id || !tableQuery.data) {
    return null
  }

  return (
    <Layout>
      <Container maxWidth="lg">
        <Typography variant="h5" mb={2}>
          {tableQuery.data.name} Schema
        </Typography>
        <SchemaEditor tableId={id} fields={fieldsQuery.data ?? []} refetch={fieldsQuery.refetch} />
      </Container>
    </Layout>
  )
}
