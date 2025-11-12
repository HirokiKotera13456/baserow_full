import { Button, MenuItem, Stack, TextField } from '@mui/material'
import { useState } from 'react'
import api from '../lib/api'
import { View } from '../types'
import { useSnackbar } from '../context/SnackbarContext'

interface ViewToolbarProps {
  tableId: number
  views: View[]
  onRefresh: () => Promise<any>
  activeView?: View | null
  onViewChange: (view: View | null) => void
}

export const ViewToolbar: React.FC<ViewToolbarProps> = ({ tableId, views, onRefresh, activeView, onViewChange }) => {
  const { openSnackbar } = useSnackbar()
  const [viewName, setViewName] = useState('')
  const [sort, setSort] = useState('')
  const [filter, setFilter] = useState('')

  const handleCreateView = async () => {
    await api.post('/views/', {
      table: tableId,
      name: viewName || 'New View',
      config: { sort: sort ? [sort] : [], filter: filter ? [filter] : [] },
    })
    await onRefresh()
    openSnackbar('View saved', 'success')
  }

  const handleApply = (raw: string) => {
    if (!raw) {
      onViewChange(null)
      return
    }
    const viewId = Number(raw)
    const view = views.find((v) => v.id === viewId) || null
    onViewChange(view)
  }

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2} alignItems="center">
      <TextField
        select
        label="Active View"
        value={activeView?.id ?? ''}
        onChange={(e) => handleApply(e.target.value)}
        sx={{ minWidth: 200 }}
      >
        <MenuItem value="">Default</MenuItem>
        {views.map((view) => (
          <MenuItem key={view.id} value={view.id}>
            {view.name}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        label="Sort (e.g. Name:asc)"
        value={sort}
        onChange={(e) => setSort(e.target.value)}
      />
      <TextField
        label="Filter (Field:op:value)"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      <TextField
        label="View Name"
        value={viewName}
        onChange={(e) => setViewName(e.target.value)}
      />
      <Button variant="outlined" onClick={handleCreateView}>
        Save View
      </Button>
    </Stack>
  )
}
