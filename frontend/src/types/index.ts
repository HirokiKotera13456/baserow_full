export type Role = 'admin' | 'member' | 'viewer'

export interface User {
  id: number
  username: string
  email: string
}

export interface RoleAssignment {
  id: number
  workspace: number
  role: Role
  user: User
}

export interface Workspace {
  id: number
  name: string
  owner: User
  members: RoleAssignment[]
}

export interface Database {
  id: number
  name: string
  workspace: number
}

export interface Table {
  id: number
  name: string
  database: number
  deleted_at: string | null
}

export type FieldType =
  | 'text'
  | 'long_text'
  | 'number'
  | 'decimal'
  | 'boolean'
  | 'date'
  | 'single_select'
  | 'multi_select'
  | 'attachment'

export interface Field {
  id: number
  table: number
  name: string
  type: FieldType
  required: boolean
  unique: boolean
  order: number
  options: Record<string, any>
}

export interface ViewConfig {
  sort?: string[]
  filter?: string[]
  hiddenFields?: string[]
}

export interface View {
  id: number
  table: number
  name: string
  config: ViewConfig
}

export interface RecordData {
  id: number
  table: number
  data: Record<string, any>
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface LoginResponse {
  access: string
  refresh: string
}
