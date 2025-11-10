# @orpaynter/connector-supabase

Complete Supabase connector for OrPaynter providing type-safe database operations, authentication, real-time subscriptions, and file storage.

## Features

- ✅ **Authentication** - Sign up, sign in, password reset, session management
- ✅ **Database Operations** - CRUD operations with type safety
- ✅ **Real-time Subscriptions** - Listen to database changes
- ✅ **File Storage** - Upload, download, and manage files
- ✅ **RPC Support** - Execute stored procedures
- ✅ **Full TypeScript Support** - Complete type definitions

## Installation

```bash
npm install @orpaynter/connector-supabase
# or
pnpm add @orpaynter/connector-supabase
```

## Quick Start

```typescript
import { createSupabaseConnector } from '@orpaynter/connector-supabase';

const supabase = createSupabaseConnector({
  url: process.env.SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY
});

// Authentication
const { user } = await supabase.signUp('user@example.com', 'password');
const session = await supabase.getSession();

// Database
const contractors = await supabase.select('contractors', { status: 'active' });
await supabase.insert('projects', { name: 'New Roof', status: 'pending' });

// Real-time
supabase.subscribe('claims', 'INSERT', (payload) => {
  console.log('New claim:', payload.new);
});
```

## API Reference

### Authentication

- `signUp(email, password, metadata?)` - Create new user
- `signIn(email, password)` - Sign in user
- `signOut()` - Sign out current user
- `getSession()` - Get current session
- `getUser()` - Get current user
- `resetPassword(email)` - Send password reset email
- `updateUser(attributes)` - Update user data

### Database

- `select<T>(table, filter?, options?)` - Query data
- `insert<T>(table, data)` - Insert records
- `update<T>(table, data, filter)` - Update records
- `delete(table, filter)` - Delete records
- `rpc<T>(functionName, params?)` - Call stored procedure

### Real-time

- `subscribe(table, event, callback, filter?)` - Subscribe to changes

### Storage

- `uploadFile(bucket, path, file)` - Upload file
- `downloadFile(bucket, path)` - Download file
- `getPublicUrl(bucket, path)` - Get public URL
- `deleteFile(bucket, paths)` - Delete file(s)
- `listFiles(bucket, path?)` - List files

## Examples

### Contractor Management

```typescript
// Create contractor
const { user } = await supabase.signUp(
  'contractor@example.com',
  'password',
  { company: 'Acme Roofing', license: 'CR-12345' }
);

// Store profile
await supabase.insert('contractors', {
  user_id: user.id,
  company: 'Acme Roofing',
  rating: 4.8
});
```

### Project Tracking

```typescript
// Create project
const [project] = await supabase.insert('projects', {
  contractor_id: 123,
  customer_name: 'Jane Smith',
  status: 'quoted',
  estimated_value: 18500
});

// Update status
await supabase.update(
  'projects',
  { status: 'in_progress', start_date: new Date().toISOString() },
  { id: project.id }
);
```

### Real-time Dashboard

```typescript
// Subscribe to new claims
supabase.subscribe('claims', 'INSERT', (payload) => {
  updateDashboard(payload.new);
  showNotification('New claim received');
});
```

## License

MIT
