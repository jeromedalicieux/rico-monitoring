module.exports = {
  apps: [
    {
      name: 'monitoring-sites-api',
      script: './backend/src/index.js',
      cwd: './backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: './backend/logs/pm2-error.log',
      out_file: './backend/logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'monitoring-sites-scheduler',
      script: './backend/src/scheduler.js',
      cwd: './backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './backend/logs/pm2-scheduler-error.log',
      out_file: './backend/logs/pm2-scheduler-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
