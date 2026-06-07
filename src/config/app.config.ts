export default () => ({
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT ?? '3000'),
  },
  jamendo: {
    clientId: process.env.JAMENDO_CLIENT_ID,
    apiBaseUrl:
      process.env.JAMENDO_API_BASE_URL || 'https://api.jamendo.com/v3.0',
  },
});
