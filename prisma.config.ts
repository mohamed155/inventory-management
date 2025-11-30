import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma-actions/schema.prisma-actions',
  migrations: {
    path: 'prisma-actions/migrations',
  },
  engine: 'classic',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
