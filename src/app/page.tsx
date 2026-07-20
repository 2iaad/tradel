import { readFileSync } from "node:fs";
import { join } from "node:path";

import { HomeInit } from "./home-init";

const homeMarkup = readFileSync(
  join(process.cwd(), "src/content/home.html"),
  "utf8",
);

export default function HomePage() {
  return (
    <>
      <div
        className="page-w"
        data-page-wrapper=""
        dangerouslySetInnerHTML={{ __html: homeMarkup }}
      />
      <HomeInit />
    </>
  );
}
