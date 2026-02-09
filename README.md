# SmartHR React Admin Template

A comprehensive, performance-optimized React admin template built with TypeScript, Vite, and modern React patterns.

## 🚀 Features

- **Modern React 19** with TypeScript support
- **Performance Optimized** with React.memo, useMemo, and useCallback
- **Code Splitting** with React.lazy and Suspense
- **Virtual Scrolling** for large datasets
- **Debounced Search** with optimized filtering
- **Redux Toolkit** with proper TypeScript integration
- **Comprehensive Error Handling** with Error Boundaries
- **Testing Setup** with Jest and React Testing Library
- **Bundle Analysis** with webpack-bundle-analyzer
- **Performance Monitoring** with real-time metrics

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Analyze bundle size
npm run build:analyze

# Run tests
npm test

# Run performance analysis
npm run performance
```

## 🏗️ Project Structure

```
src/
├── core/
│   ├── common/           # Shared components
│   ├── data/            # Redux store and types
│   ├── hooks/           # Custom hooks
│   ├── modals/          # Modal components
│   ├── providers/       # Context providers
│   └── utils/           # Utility functions
├── feature-module/      # Feature-based modules
├── router/             # Routing configuration
├── assets/             # Static assets
└── components/         # Global components
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
# Base URL for the NBS Archive API
# For development: leave VITE_API_BASE_URL unset so the Vite proxy is used (proxy target: http://192.168.116.15:8070)
# For production: set to your backend URL, e.g. http://192.168.116.15:8070
# VITE_API_BASE_URL=http://192.168.116.15:8070

# Optional: App configuration
VITE_APP_NAME=SmartHR
VITE_ENABLE_PERFORMANCE_MONITORING=true
```

**Note**: The `VITE_API_BASE_URL` environment variable is used by the API client. **Leave it unset in development** so requests go to `/api/...` and the Vite proxy forwards them to the backend (e.g. `http://192.168.116.15:8070`). If you set it to a full URL, the app will call that URL directly (no proxy). All API endpoints are prefixed with `/api/`.

### Trigger NBS Archive APIs (login, upload, create folder)

A script triggers the login, upload document, and create folder APIs so you can verify success or errors without using the UI.

**Usage:**

```bash
# Backend must be reachable at the base URL (default: http://localhost:8070)
npm run trigger-apis
```

**Environment (optional):** Set `API_BASE_URL` or `VITE_API_BASE_URL` when the backend is not on `http://localhost:8070` (e.g. when using the same host as the Vite proxy):

```bash
# Windows (PowerShell)
$env:API_BASE_URL="http://192.168.116.15:8070"; npm run trigger-apis

# Linux/macOS
API_BASE_URL=http://192.168.116.15:8070 npm run trigger-apis
```

**What it does:** Logs in with `admin` / `admin`, then calls upload document (plain JSON) and create folder (JSON-RPC). It fetches the first department and document type for the upload.

**Success/error reporting:** For each step the script prints HTTP status, `success`/`error`, and `data.id` when present. Login failure (e.g. 401 or missing `access_token`) exits with code 1; upload and folder steps always run and report success or error in the output.

### Performance Settings

Configure performance options in `src/main.tsx`:

```typescript
<PerformanceProvider
  enableProfiling={false}
  enableMemoization={true}
  enableVirtualization={true}
>
```

## 🎯 Performance Optimizations

### 1. Component Optimization

- **React.memo**: Prevents unnecessary re-renders
- **useMemo**: Memoizes expensive calculations
- **useCallback**: Memoizes event handlers

### 2. Search Optimization

- **Debounced Search**: 300ms delay prevents excessive filtering
- **Virtual Scrolling**: Only renders visible items
- **Lazy Loading**: Images and components load on demand

### 3. Bundle Optimization

- **Code Splitting**: Feature-based chunks
- **Tree Shaking**: Removes unused code
- **Bundle Analysis**: Monitor bundle sizes

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- --testPathPattern=ComponentName
```

### Test Structure

```
__tests__/
├── components/         # Component tests
├── hooks/             # Hook tests
├── utils/             # Utility tests
└── integration/       # Integration tests
```

## 📊 Performance Monitoring

### Performance Dashboard

Access the performance dashboard to monitor:

- Component render times
- Memory usage
- Bundle sizes
- Slow components

### Performance Metrics

- **Average Render Time**: Target < 16ms
- **Bundle Size**: Target < 500KB initial
- **Memory Usage**: Monitor for leaks

## 🔍 Development Guidelines

### 1. Component Development

```typescript
// Use React.memo for components
const MyComponent = React.memo(({ data, onAction }) => {
  // Memoize expensive calculations
  const processedData = useMemo(() => expensiveCalculation(data), [data]);

  // Memoize event handlers
  const handleClick = useCallback(() => {
    onAction(processedData);
  }, [onAction, processedData]);

  return <div onClick={handleClick}>{/* JSX */}</div>;
});
```

### 2. State Management

```typescript
// Use Redux Toolkit with proper types
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "./store";

const MyComponent = () => {
  const dispatch = useDispatch<AppDispatch>();
  const data = useSelector((state: RootState) => state.mySlice.data);

  // Use typed actions
  const handleAction = useCallback(() => {
    dispatch(myAction({ payload: "data" }));
  }, [dispatch]);
};
```

### 3. Error Handling

```typescript
// Use Error Boundaries
<ErrorBoundary
  fallback={<ErrorFallback />}
  onError={(error, errorInfo) => {
    // Log error to monitoring service
    logError(error, errorInfo);
  }}
>
  <MyComponent />
</ErrorBoundary>
```

## 🚀 Deployment

### Build for Production

```bash
# Create optimized build
npm run build

# Preview production build
npm run preview
```

### Bundle Analysis

```bash
# Analyze bundle size
npm run build:analyze

# View bundle report
open dist/bundle-report.html
```

## 📈 Performance Best Practices

### 1. Component Optimization

- Use `React.memo` for components with stable props
- Implement `useMemo` for expensive calculations
- Use `useCallback` for event handlers passed to children
- Avoid creating objects/arrays in render functions

### 2. State Management

- Use `useBatchState` for multiple state updates
- Implement debouncing for search inputs
- Use throttling for scroll/resize events
- Avoid unnecessary state updates

### 3. Rendering Optimization

- Use virtual scrolling for large lists
- Implement lazy loading for images
- Use intersection observer for on-demand loading
- Optimize re-render cycles

## 🐛 Troubleshooting

### Common Issues

1. **Performance Issues**

   - Check Performance Dashboard
   - Use React DevTools Profiler
   - Monitor bundle sizes

2. **TypeScript Errors**

   - Ensure proper type definitions
   - Use strict TypeScript configuration
   - Check Redux type integration

3. **Build Issues**
   - Clear node_modules and reinstall
   - Check Vite configuration
   - Verify import paths

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation
- Review performance guidelines
- Consult the troubleshooting section

## 🔄 Changelog

### v1.5.6

- Performance optimizations implemented
- TypeScript improvements
- Error handling enhancements
- Testing infrastructure added
- Bundle analysis tools integrated
