import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { build } from 'vite'


const __dirname = path.dirname(fileURLToPath(import.meta.url))

const dirs = Object.fromEntries(
  ["app", "ssr", "static"].map(
    (key) => [ key, path.resolve(__dirname, `build/${key}`) ]
  )
)
dirs["src"] = path.resolve(__dirname, "src")


async function main() {
  // Step 1. build app
  await build({
    build: { outDir: dirs.app }
  })

  // Step 2. build src/ssr-entry.js for rendering html
  await build({
    build: {
      ssr: path.join(dirs.src, "ssr-entry.js"),
      outDir: dirs.ssr,
    }
  })

  // Step 3. generate rendered index.html
  const template = await fs.readFile(path.join(dirs.app, "index.html"), "utf-8");
  const { render } = await import("./build/ssr/ssr-entry.js");
  const rendered = render()
  const html = template
        .replace("<!--app-head-->", rendered.head || "")
        .replace("<!--app-html-->", rendered.html || "");

  await fs.rm(dirs.static, { recursive: true, force: true })
  await fs.cp(dirs.app, dirs.static, { recursive: true })
  await fs.writeFile(
    path.join(dirs.static, "index.html"),
    html,
    { encoding: "utf-8" }
  )

  console.log("output: build/static")
}
main()
