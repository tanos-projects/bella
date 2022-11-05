module.exports = {
  apps: [
    {
      name: 'api',
      script: 'dist/apps/api/main.js',
      watch: '.',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        CORS_ALLOW_LIST:
          'https://dev.bellannonces.com,https://www.dev.bellannonces.com',
        AUTH_ISSUER_URL: 'https://dev-bata.eu.auth0.com/',
        AUTH_AUDIENCE: 'https://base-api/',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],

  deploy: {
    development: {
      key: '~/.ssh/dev3-aws-bella.pem',
      user: 'ubuntu',
      host: 'ec2-54-172-187-8.compute-1.amazonaws.com',
      ref: 'origin/dev',
      repo: 'git@github.com:tanos-projects/bella.git',
      path: '/home/ubuntu/projects/bella/workspace',
      'pre-deploy-local': '',
      'post-deploy':
        'yarn install && yarn build api && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
    production: {
      key: '~/.ssh/dev3-aws-bella.pem',
      user: 'ubuntu',
      host: 'ec2-54-172-187-8.compute-1.amazonaws.com',
      ref: 'origin/main',
      repo: 'git@github.com:tanos-projects/bella.git',
      path: '/home/ubuntu/projects/bella/workspace',
      'pre-deploy-local': '',
      'post-deploy':
        'yarn install && yarn build api && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
  },
};
