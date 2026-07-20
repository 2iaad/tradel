import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const root = join(process.cwd(), "out");
const port = Number.parseInt(process.env.PORT ?? "4321", 10);
const mimeTypes = {
  ".avif": "image/avif",
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp4": "video/mp4",
  ".otf": "font/otf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".ttf": "font/ttf",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

const server = createServer((request, response) => {
  const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
  const safePath = normalize(decodeURIComponent(pathname)).replace(
    /^(\.\.[/\\])+/,
    "",
  );
  let filePath = join(root, safePath);

  if (pathname.endsWith("/")) filePath = join(filePath, "index.html");
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    filePath = join(root, "index.html");
  }

  response.setHeader(
    "Content-Type",
    mimeTypes[extname(filePath)] ?? "application/octet-stream",
  );
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Accept-Ranges", "bytes");

  const { size } = statSync(filePath);
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range ?? "");
  if (range && (range[1] || range[2])) {
    const start = range[1] ? Number.parseInt(range[1], 10) : 0;
    const end = range[2]
      ? Math.min(Number.parseInt(range[2], 10), size - 1)
      : size - 1;
    response.statusCode = 206;
    response.setHeader("Content-Range", `bytes ${start}-${end}/${size}`);
    response.setHeader("Content-Length", end - start + 1);
    createReadStream(filePath, { end, start }).pipe(response);
    return;
  }

  response.setHeader("Content-Length", size);
  createReadStream(filePath).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Tradel preview ready at http://127.0.0.1:${port}`);
});
