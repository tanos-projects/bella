import { registerAs } from '@nestjs/config';

export interface DatabaseConfig {
  uri: string;
  user?: string;
  password?: string;
}

export default registerAs(
  'database',
  (): DatabaseConfig => ({
    uri: process.env.DATABASE_URL || 'mongodb://localhost:27017/tangazo',
    // user: process.env.DATABASE_USER,
    // password: process.env.DATABASE_PASSWORD,
  }),
);
