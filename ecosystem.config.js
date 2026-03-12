module.exports = {
  apps: [
    {
      name: 'triverse-erp-backend',
      script: './dist/src/main.js',
      cwd: './backend',
      instances: 1,
      exec_mode: 'cluster',
      
      // Memory & Performance
      max_memory_restart: '512M',
      node_args: '--max-old-space-size=512',
      
      // Environment
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      
      // Logging
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Restart Strategy
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Monitoring
      instance_var: 'INSTANCE_ID',
      
      // Process Management
      kill_timeout: 5000,
      listen_timeout: 10000,
      
      // Graceful Reload
      wait_ready: true,
      shutdown_with_message: true,
    },
  ],
};
