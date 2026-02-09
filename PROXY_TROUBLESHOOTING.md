# Proxy Troubleshooting Guide

## Current Configuration

- **Frontend Port**: `3002` (configured in `vite.config.ts`)
- **Backend Target**: `http://192.168.116.15:8070` (configured in proxy)
- **API Base URL**: Empty string (uses relative URLs for proxy)

## Common Issues and Solutions

### 1. 404 Errors on All API Calls

**Symptoms**: All API requests return 404 Not Found

**Possible Causes**:
- Dev server not restarted after proxy config changes
- Backend not running or not accessible at `http://192.168.116.15:8070`
- Wrong backend IP/port in proxy config

**Solutions**:
1. **Restart the dev server**:
   ```bash
   # Stop the current dev server (Ctrl+C)
   npm run dev
   ```

2. **Verify backend is accessible**:
   ```bash
   # Test if backend is reachable
   curl http://192.168.116.15:8070/api/health
   ```

3. **Check proxy target in `vite.config.ts`**:
   - Ensure `target: 'http://192.168.116.15:8070'` matches your backend
   - If your backend is on a different IP/port, update the target

### 2. CORS Errors

**Symptoms**: Browser console shows CORS errors

**Solution**: The proxy should handle CORS automatically. If you see CORS errors:
- Make sure you're using relative URLs (starting with `/api/...`)
- Don't set `VITE_API_BASE_URL` in `.env` file (leave it empty for proxy)

### 3. Proxy Not Working

**Symptoms**: Requests go directly to backend (bypassing proxy)

**Solutions**:
1. Check that `VITE_API_BASE_URL` is not set in `.env` file
2. Verify API client uses relative URLs (check `src/app/adapter/api/client.ts`)
3. Check browser Network tab - requests should go to `localhost:3002/api/...`

## Testing the Proxy

1. **Start dev server**:
   ```bash
   npm run dev
   ```

2. **Open browser console** and check Network tab

3. **Make an API call** (e.g., load dashboard)

4. **Verify**:
   - Request URL should be `http://localhost:3002/api/stats/dashboard`
   - Status should be 200 (not 404)
   - Response should come from backend

## Environment Variables

**For Development (using proxy)**:
```env
# Leave VITE_API_BASE_URL empty or don't set it
# This allows Vite proxy to handle requests
```

**For Production**:
```env
VITE_API_BASE_URL=http://your-backend-url:port
```

## Debugging Steps

1. Check if backend is running:
   ```bash
   curl http://192.168.116.15:8070/api/health
   ```

2. Check proxy configuration in `vite.config.ts`:
   - Port should match your dev server port (3002)
   - Target should match your backend URL

3. Check browser Network tab:
   - Look for requests to `localhost:3002/api/...`
   - Check if they're being proxied correctly

4. Check console logs:
   - Look for any proxy-related errors
   - Check if requests are being made

## Next Steps

If you're still getting 404 errors:

1. **Verify backend is running** at `http://192.168.116.15:8070`
2. **Check backend logs** to see if requests are reaching it
3. **Test backend directly** with curl:
   ```bash
   curl -X POST http://192.168.116.15:8070/api/stats/dashboard \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"call","params":{},"id":1}'
   ```
4. **Update proxy target** if backend is on different IP/port
