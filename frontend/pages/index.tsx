import { Button, Container, Stack, Typography } from '@mui/material'
import Link from 'next/link'
import { Layout } from '../src/components/Layout'

export default function Home() {
  return (
    <Layout>
      <Container maxWidth="md">
        <Stack spacing={3} mt={4}>
          <Typography variant="h4">Welcome to Generic DB UI</Typography>
          <Typography>
            Manage workspaces, databases, tables, and records in a flexible spreadsheet-like experience. Login to explore the
            sample workspace seeded in the backend and customise the schema to your needs.
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button variant="contained" component={Link} href="/login">
              Login
            </Button>
            <Button variant="outlined" component={Link} href="/workspaces">
              View Workspaces
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Layout>
  )
}
