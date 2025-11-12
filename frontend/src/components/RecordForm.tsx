import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { Field } from '../types'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'

const buildSchema = (fields: Field[]) => {
  const shape: Record<string, z.ZodTypeAny> = {}
  fields.forEach((field) => {
    let schema: z.ZodTypeAny = z.any()
    switch (field.type) {
      case 'number':
      case 'decimal':
        schema = z.union([z.string(), z.number()]).transform((val) => (val === '' ? null : Number(val)))
        break
      case 'boolean':
        schema = z.boolean().or(z.string().transform((val) => val === 'true'))
        break
      case 'date':
        schema = z.string()
        break
      case 'single_select':
        schema = z.string()
        break
      case 'multi_select':
        schema = z.array(z.string())
        break
      default:
        schema = z.string().or(z.null()).transform((val) => (val === null ? '' : String(val)))
    }
    if (!field.required) {
      schema = schema.optional()
    }
    shape[field.name] = schema
  })
  return z.object(shape)
}

interface RecordFormProps {
  open: boolean
  onClose: () => void
  fields: Field[]
  initialData?: Record<string, any>
  onSubmit: (values: Record<string, any>) => Promise<void>
  title: string
}

export const RecordForm: React.FC<RecordFormProps> = ({ open, onClose, fields, initialData, onSubmit, title }) => {
  const schema = buildSchema(fields)
  const form = useForm<Record<string, any>>({
    resolver: zodResolver(schema),
    defaultValues: initialData ?? {},
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    form.reset(initialData ?? {})
  }, [initialData, form, open])

  const handleSubmit = form.handleSubmit(async (values) => {
    setLoading(true)
    try {
      await onSubmit(values)
      form.reset()
      onClose()
    } finally {
      setLoading(false)
    }
  })

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ mt: 2 }}>
          <Stack spacing={2}>
            {fields.map((field) => {
              const value = form.watch(field.name)
              switch (field.type) {
                case 'single_select':
                  return (
                    <TextField
                      key={field.id}
                      select
                      label={field.name}
                      value={value ?? ''}
                      onChange={(e) => form.setValue(field.name, e.target.value)}
                    >
                      {field.options?.choices?.map((choice: string) => (
                        <MenuItem key={choice} value={choice}>
                          {choice}
                        </MenuItem>
                      ))}
                    </TextField>
                  )
                case 'multi_select':
                  return (
                    <TextField
                      key={field.id}
                      select
                      SelectProps={{ multiple: true }}
                      label={field.name}
                      value={value ?? []}
                      onChange={(e) => form.setValue(field.name, e.target.value as string[])}
                    >
                      {field.options?.choices?.map((choice: string) => (
                        <MenuItem key={choice} value={choice}>
                          {choice}
                        </MenuItem>
                      ))}
                    </TextField>
                  )
                case 'date':
                  return (
                    <DatePicker
                      key={field.id}
                      label={field.name}
                      value={value ? new Date(value) : null}
                      onChange={(date) => {
                        form.setValue(field.name, date ? format(date, 'yyyy-MM-dd') : '')
                      }}
                    />
                  )
                case 'boolean':
                  return (
                    <TextField
                      key={field.id}
                      select
                      label={field.name}
                      value={String(value ?? 'false')}
                      onChange={(e) => form.setValue(field.name, e.target.value)}
                    >
                      <MenuItem value="true">True</MenuItem>
                      <MenuItem value="false">False</MenuItem>
                    </TextField>
                  )
                default:
                  return (
                    <TextField
                      key={field.id}
                      label={field.name}
                      value={value ?? ''}
                      onChange={(e) => form.setValue(field.name, e.target.value)}
                    />
                  )
              }
            })}
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}
