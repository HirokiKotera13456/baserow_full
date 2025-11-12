import { useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { Field, FieldType } from '../types'
import api from '../lib/api'
import { useSnackbar } from '../context/SnackbarContext'

const fieldTypes: { label: string; value: FieldType }[] = [
  { label: 'Text', value: 'text' },
  { label: 'Long Text', value: 'long_text' },
  { label: 'Number', value: 'number' },
  { label: 'Decimal', value: 'decimal' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Date', value: 'date' },
  { label: 'Single Select', value: 'single_select' },
  { label: 'Multi Select', value: 'multi_select' },
  { label: 'Attachment', value: 'attachment' },
]

interface SchemaEditorProps {
  tableId: number
  fields: Field[]
  refetch: () => Promise<any>
}

export const SchemaEditor: React.FC<SchemaEditorProps> = ({ tableId, fields, refetch }) => {
  const { openSnackbar } = useSnackbar()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'text', required: false, unique: false, options: '' })

  const handleCreate = async () => {
    try {
      const payload: any = {
        table: tableId,
        name: form.name,
        type: form.type,
        required: form.required,
        unique: form.unique,
      }
      if (form.type.includes('select') && form.options) {
        payload.options = { choices: form.options.split(',').map((v) => v.trim()) }
      }
      await api.post('/fields/', payload)
      await refetch()
      openSnackbar('Field created', 'success')
    } catch (error: any) {
      openSnackbar(error?.response?.data?.detail ?? 'Failed to create field', 'error')
    }
  }

  const handleDelete = async (fieldId: number) => {
    await api.delete(`/fields/${fieldId}/`)
    await refetch()
    openSnackbar('Field deleted', 'success')
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Fields</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>
          Add Field
        </Button>
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Required</TableCell>
            <TableCell>Unique</TableCell>
            <TableCell width={120}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {fields.map((field) => (
            <TableRow key={field.id}>
              <TableCell>{field.name}</TableCell>
              <TableCell>{field.type}</TableCell>
              <TableCell>{field.required ? 'Yes' : 'No'}</TableCell>
              <TableCell>{field.unique ? 'Yes' : 'No'}</TableCell>
              <TableCell>
                <Button color="error" size="small" onClick={() => handleDelete(field.id)}>
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>New Field</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
            <TextField
              select
              label="Type"
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
            >
              {fieldTypes.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            {(form.type === 'single_select' || form.type === 'multi_select') && (
              <TextField
                label="Options (comma separated)"
                value={form.options}
                onChange={(e) => setForm((prev) => ({ ...prev, options: e.target.value }))}
              />
            )}
            <Box display="flex" alignItems="center" gap={1}>
              <Switch
                checked={form.required}
                onChange={(e) => setForm((prev) => ({ ...prev, required: e.target.checked }))}
              />
              <Typography>Required</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Switch checked={form.unique} onChange={(e) => setForm((prev) => ({ ...prev, unique: e.target.checked }))} />
              <Typography>Unique</Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={async () => { await handleCreate(); setOpen(false) }} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
