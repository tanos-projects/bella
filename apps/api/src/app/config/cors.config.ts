import * as dotenv from 'dotenv';

dotenv.config();

const allowlist = process.env.CORS_ALLOW_LIST?.split(',');

export const corsOptionsDelegate = function (req, callback) {
  const isDomainAllowed = allowlist?.includes(req.header('Origin'));
  const corsOptions = { origin: isDomainAllowed };
  callback(null, corsOptions);
};
