export default () => ({
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT ?? '3000'),
    frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  },
  uploads: {
    dir: process.env.UPLOADS_DIR,
    publicBackendUrl: process.env.PUBLIC_BACKEND_URL,
  },
  jamendo: {
    clientId: process.env.JAMENDO_CLIENT_ID,
    clientSecret: process.env.JAMENDO_CLIENT_SECRET,
    redirectUri: process.env.JAMENDO_REDIRECT_URI,
    apiBaseUrl:
      process.env.JAMENDO_API_BASE_URL || 'https://api.jamendo.com/v3.0',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET,
  },
});
