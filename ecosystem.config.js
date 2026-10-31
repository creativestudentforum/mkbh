/**
 * PM2 Cluster Mode Configuration
 * Balances traffic across CPU cores on a single or multi-core host.
 */
module.exports = {
  apps: [
    {
      name: "alumni-hub",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      instances: "max", // Scale to all available CPU cores
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      max_memory_restart: "1G",
      listen_timeout: 10000,
      kill_timeout: 5000,
      wait_ready: true,
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      merge_logs: true,
    },
  ],
};
