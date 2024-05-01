import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"


const __dirname = path.dirname(fileURLToPath(import.meta.url))

const dirs = Object.fromEntries(
  ["app", "ssg", "static"].map((key) => {
    return [ key, path.resolve(__dirname, `build/${key}`) ];
  })
)

async function main() {
  const template = await fs.readFile(path.join(dirs.app, "index.html"), "utf-8");
  const { render } = await import("./build/ssg/ssg-entry.js");
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
}
main()
