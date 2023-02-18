import { registerAs } from '@nestjs/config';

export interface DatabaseConfig {
  uri: string;
  user?: string;
  password?: string;
}

export default registerAs(
  'database',
  (): DatabaseConfig => {
    console.log(`------------- DATABASE URI -------------\n\n${process.env.DATABASE_URL}`)
    return {
      uri: process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/tangazo',
      // user: process.env.DATABASE_USER,
      // password: process.env.DATABASE_PASSWORD,
    }
  },
);
