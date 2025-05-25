# Edge Function Deployment Guide

## User Management Edge Function

The user management functionality requires a Supabase Edge Function to be deployed. This function handles:

- Listing all users from Supabase Auth
- Creating new users with role assignment
- Deleting users (except current admin)

## Prerequisites

1. **Docker Desktop**: Required for building and deploying Edge Functions

   - Download from: https://docs.docker.com/desktop/
   - Make sure Docker is running before deployment

2. **Supabase CLI**: Already included in the project via npx

## Deployment Steps

### 1. Login to Supabase

```bash
npx supabase login
```

Follow the browser prompt to authenticate.

### 2. Deploy the Edge Function

```bash
npx supabase functions deploy user-management --project-ref zsiytgieabllretyyrpi
```

### 3. Verify Deployment

After successful deployment, the user management interface will automatically detect the function and show real user data.

## Function Details

**Location**: `supabase/functions/user-management/index.ts`

**Endpoints**:

- `GET ?action=list` - List all users
- `POST ?action=create` - Create new user
- `DELETE ?action=delete` - Delete user

**Security**:

- Requires valid authentication token
- Admin-only access (checks email and role metadata)
- Prevents self-deletion

## Troubleshooting

### Docker Not Running

```
Error: Cannot connect to the Docker daemon
```

**Solution**: Start Docker Desktop and ensure it's running.

### Authentication Issues

```
Error: Access token not provided
```

**Solution**: Run `npx supabase login` first.

### Function Not Found (404)

The app will show a fallback view with deployment instructions if the function isn't deployed yet.

## Environment Variables

The Edge Function uses these Supabase environment variables (automatically available):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Admin Configuration

Admin users are determined by:

1. Email in hardcoded list: `["projects.smit@gmail.com"]`
2. `user_metadata.role === "admin"`
3. `app_metadata.role === "admin"`

To add more admin emails, update the `adminEmails` array in the Edge Function.

## Fallback Behavior

Without the Edge Function deployed:

- Shows only current user in the table
- Displays deployment instructions
- Create/Delete operations show helpful error messages
- Basic functionality remains available

## Production Considerations

1. **Service Role Key**: Ensure your Supabase project has the service role key configured
2. **CORS**: The function includes CORS headers for web app access
3. **Rate Limiting**: Consider implementing rate limiting for production use
4. **Logging**: Add proper logging for audit trails
5. **Validation**: The function includes input validation and error handling
