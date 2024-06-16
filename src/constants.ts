import path from "node:path";

export const APP_PATH_WITHOUT_SRC = path.normalize(
  path.join(process.cwd(), "app")
);

export const APP_PATH_WITH_SRC = path.normalize(
  path.join(process.cwd(), "src", "app")
);
