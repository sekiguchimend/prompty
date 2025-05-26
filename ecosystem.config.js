module.exports = {
  apps: [
    {
      name: 'prompty',
      script: 'npm',
      args: 'start',
      cwd: '/home/ec2-user/prompty',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/home/ec2-user/logs/prompty-error.log',
      out_file: '/home/ec2-user/logs/prompty-out.log',
      log_file: '/home/ec2-user/logs/prompty-combined.log',
      time: true,
    },
  ],
}; 