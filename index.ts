import express from 'express';
import { createRouter, bootstrap } from './server/generated';
import * as implementation from './server/implementation';

const app = express();

// Middleware
app.use(express.json());

// Create the API router with your implementation
const apiRouter = createRouter(implementation);
app.use(apiRouter);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API endpoints available based on OpenAPI spec`);
});

export default app;
