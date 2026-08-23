import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

async function reachable(url) {
  try { return (await fetch(url)).ok } catch { return false }
}

/** Levanta `vite preview` sobre dist/ y devuelve la URL base y cómo pararlo. */
export async function preview(port = 4173) {
  const url = `http://127.0.0.1:${port}/`
  if (await reachable(url)) return { url, stop: () => {} }

  const child = spawn('npx', ['vite', 'preview', '--port', String(port), '--host', '127.0.0.1', '--strictPort'], {
    stdio: 'ignore',
  })
  for (let i = 0; i < 60; i++) {
    await wait(250)
    if (await reachable(url)) return { url, stop: () => child.kill() }
  }
  child.kill()
  throw new Error(`vite preview no respondió en ${url}. ¿Has ejecutado "npm run build"?`)
}

/**
 * Sirve el fragmento de artifact/ envuelto como lo envuelve el visor:
 * doctype, head mínimo con un reset, y el fragmento dentro del body.
 */
export async function artifactPreview(port = 4180) {
  const fragment = readFileSync('artifact/areen-velthar.html', 'utf8')
  const page = `<!doctype html><html lang="es"><head><meta charset="utf-8">`
    + `<meta name="viewport" content="width=device-width,initial-scale=1">`
    + `<style>*,*::before,*::after{box-sizing:border-box}body{margin:0}img,video{max-width:100%;height:auto}</style>`
    + `</head><body>\n${fragment}\n</body></html>`

  const server = createServer((req, res) => {
    if (req.url === '/favicon.ico') { res.writeHead(204).end(); return }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(page)
  })
  await new Promise((r) => server.listen(port, '127.0.0.1', r))
  return { url: `http://127.0.0.1:${port}/`, stop: () => server.close() }
}
