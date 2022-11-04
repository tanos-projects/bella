module.exports = {
  apps : [{
    name: 'api',
    script: 'dist/apps/api/main.js',
    watch: '.'
  }],

  deploy : {
    production : {
      user : 'ubuntu',
      host : 'ec2-54-163-152-228.compute-1.amazonaws.com',
      ref  : 'origin/main',
      repo : 'https://github.com/tanos-projects/bella.git',
      path : '/home/ubuntu/projects/bella/workspace',
      'pre-deploy-local': '',
      'post-deploy' : 'yarn install && yarn build api && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
