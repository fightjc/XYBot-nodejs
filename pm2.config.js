module.exports = {
  apps: [
    {
      name: 'xybot',
      cwd: './',
      script: './src/app.ts',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'data'],
      // min_uptime: "1000",
      interpreter: "./node_modules/.bin/ts-node",
      // interpreter_args: "-r tsconfig-paths/register",
      // max_memory_restart: "512M",
      exec_mode: "fork",
      instances: 1,
      autorestart: false
    }
  ]
}