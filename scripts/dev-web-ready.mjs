import { spawn } from 'node:child_process'
import waitOn from 'wait-on'

const port = process.env.API_PORT ?? process.env.PORT ?? '3000'

await waitOn({
  resources: [`http://127.0.0.1:${port}/health`]
})

const child = spawn('npm run dev:web', [], {
  stdio: 'inherit',
  shell: true,
  env: process.env
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 0)
})
