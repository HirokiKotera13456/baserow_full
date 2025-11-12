import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid'
import { Box, Button, Stack, TextField } from '@mui/material'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import api from '../lib/api'
import { Field, RecordData, View } from '../types'
import { RecordForm } from './RecordForm'
import { useSnackbar } from '../context/SnackbarContext'
import { ViewToolbar } from './ViewToolbar'
import { useAuth } from '../context/AuthContext'

interface DataGridViewProps {
  tableId: number
  workspaceId: number
}

interface ListResponse<T> {
  results?: T[]
}

export const DataGridView: React.FC<DataGridViewProps> = ({ tableId, workspaceId }) => {
  const queryClient = useQueryClient()
  const { openSnackbar } = useSnackbar()
  const { roleByWorkspace } = useAuth()
  const [search, setSearch] = useState('')
  const [activeView, setActiveView] = useState<View | null>(null)
  const [viewKey, setViewKey] = useState(0)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<RecordData | null>(null)

  const canEdit = ['admin', 'member'].includes(roleByWorkspace[workspaceId] ?? '')

  const fieldsQuery = useQuery(['fields', tableId], async () => {
    const response = await api.get<ListResponse<Field>>('/fields/', { params: { table: tableId } })
    return Array.isArray(response.data) ? response.data : response.data.results ?? []
  })

  const viewsQuery = useQuery(['views', tableId, viewKey], async () => {
    const response = await api.get<ListResponse<View>>('/views/', { params: { table: tableId } })
    return Array.isArray(response.data) ? response.data : response.data.results ?? []
  })

  const recordsQuery = useQuery(['records', tableId, search, activeView?.id, viewKey], async () => {
    const params: Record<string, any> = {}
    if (search) params.search = search
    if (activeView?.config?.sort?.length) params.sort = activeView.config.sort.join(',')
    if (activeView?.config?.filter?.length) params.filter = activeView.config.filter.join(',')
    const response = await api.get<ListResponse<RecordData>>(`/tables/${tableId}/records`, { params })
    return Array.isArray(response.data) ? response.data : response.data.results ?? []
  })

  const columns: GridColDef[] = useMemo(() => {
    const base: GridColDef[] = [{ field: 'id', headerName: 'ID', width: 90 }]
    fieldsQuery.data?.forEach((field) => {
      base.push({
        field: field.name,
        headerName: field.name,
        flex: 1,
        valueGetter: (params) => params.row.data?.[field.name] ?? '',
      })
    })
    return base
  }, [fieldsQuery.data])

  const handleCreateRecord = async (values: Record<string, any>) => {
    await api.post(`/tables/${tableId}/records`, { data: values })
    await queryClient.invalidateQueries({ queryKey: ['records', tableId], exact: false })
    openSnackbar('Record created', 'success')
  }

  const handleUpdateRecord = async (values: Record<string, any>) => {
    if (!editingRecord) return
    await api.patch(`/tables/${tableId}/records/${editingRecord.id}`, { data: values })
    await queryClient.invalidateQueries({ queryKey: ['records', tableId], exact: false })
    openSnackbar('Record updated', 'success')
  }

  const handleDeleteRecord = async (id: number) => {
    await api.delete(`/tables/${tableId}/records/${id}`)
    await queryClient.invalidateQueries({ queryKey: ['records', tableId], exact: false })
    openSnackbar('Record deleted', 'success')
    setEditingRecord(null)
    setIsFormOpen(false)
  }

  const handleRowDoubleClick = (params: GridRowParams) => {
    if (!canEdit) return
    setEditingRecord(params.row as RecordData)
    setIsFormOpen(true)
  }

  const fields = fieldsQuery.data ?? []

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2} alignItems="center">
        <TextField label="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
        {canEdit && (
          <Button variant="contained" onClick={() => { setEditingRecord(null); setIsFormOpen(true) }}>
            Add Record
          </Button>
        )}
        {canEdit && editingRecord && (
          <Button color="error" onClick={() => handleDeleteRecord(editingRecord.id)}>
            Delete Selected
          </Button>
        )}
      </Stack>
      <ViewToolbar
        tableId={tableId}
        views={viewsQuery.data ?? []}
        onRefresh={async () => {
          await viewsQuery.refetch()
          setViewKey((prev) => prev + 1)
        }}
        activeView={activeView}
        onViewChange={(view) => {
          setActiveView(view)
          setViewKey((prev) => prev + 1)
        }}
      />
      <DataGrid
        autoHeight
        rows={recordsQuery.data ?? []}
        columns={columns}
        getRowId={(row) => row.id}
        onRowClick={(params) => setEditingRecord(params.row as RecordData)}
        onRowDoubleClick={handleRowDoubleClick}
        disableRowSelectionOnClick
      />
      <RecordForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        fields={fields}
        initialData={editingRecord?.data}
        onSubmit={async (values) => {
          if (editingRecord) {
            await handleUpdateRecord(values)
          } else {
            await handleCreateRecord(values)
          }
          setEditingRecord(null)
        }}
        title={editingRecord ? 'Edit Record' : 'New Record'}
      />
    </Box>
  )
}
