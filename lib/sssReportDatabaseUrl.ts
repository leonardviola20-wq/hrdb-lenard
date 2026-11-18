export function getSssReportDatabaseUrl(environmentVariable: string, databaseName: string) {
  const configuredUrl = process.env[environmentVariable];
  const sourceUrl = configuredUrl ?? (process.env.NODE_ENV === "development" ? process.env.DATABASE_URL : undefined);
  if (!sourceUrl) {
    throw new Error(`${environmentVariable} must be configured for the SSS reporting database.`);
  }

  const url = new URL(sourceUrl);
  if (configuredUrl) {
    const configuredDatabase = decodeURIComponent(url.pathname.slice(1));
    if (configuredDatabase !== databaseName) {
      throw new Error(`${environmentVariable} must point to the ${databaseName} database.`);
    }
  } else {
    url.pathname = `/${databaseName}`;
  }
  return url.toString();
}
