import { Button, Container, Stack, TextField, Typography } from '@mui/material'
import { useForm } from 'react-hook-form'
import { Layout } from '../src/components/Layout'
import { useAuth } from '../src/context/AuthContext'

interface FormValues {
  username: string
  password: string
}

export default function LoginPage() {
  const { login } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>()

  const onSubmit = async (values: FormValues) => {
    await login(values.username, values.password)
  }

  return (
    <Layout>
      <Container maxWidth="xs">
        <Stack spacing={3} mt={8} component="form" onSubmit={handleSubmit(onSubmit)}>
          <Typography variant="h5" textAlign="center">
            Sign in
          </Typography>
          <TextField label="Username" {...register('username', { required: 'Username is required' })} error={Boolean(errors.username)} helperText={errors.username?.message} />
          <TextField
            label="Password"
            type="password"
            {...register('password', { required: 'Password is required' })}
            error={Boolean(errors.password)}
            helperText={errors.password?.message}
          />
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            Login
          </Button>
        </Stack>
      </Container>
    </Layout>
  )
}
