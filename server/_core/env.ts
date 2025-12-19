export const ENV = {
  appId: process.env.VITE_APP_ID ?? "adp-observability",
  cookieSecret: process.env.JWT_SECRET ?? "observability-demo-secret",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Google AI API for LLM features
  googleAiApiKey: process.env.GOOGLE_AI_API_KEY ?? "",
  // Mock data mode
  useMockData: process.env.USE_MOCK_DATA === "true",
  // InfluxDB configuration
  // Expected values:
  // - INFLUXDB_URL: https://us-east-1-1.aws.cloud2.influxdata.com (or equivalent host)
  // - INFLUXDB_ORG: GluNet
  // - INFLUXDB_BUCKET: CLOUD
  influxDbUrl: process.env.INFLUXDB_URL ?? "",
  influxDbToken: process.env.INFLUXDB_TOKEN ?? "",
  influxDbOrg: process.env.INFLUXDB_ORG ?? "",
  influxDbBucket: process.env.INFLUXDB_BUCKET ?? "",
  // InfluxDB 1.x authentication (username/password)
  influxDbUsername: process.env.INFLUXDB_USERNAME ?? "",
  influxDbPassword: process.env.INFLUXDB_PASSWORD ?? "",
};
