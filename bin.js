#!/usr/bin/env node

import cac from "cac";
import start from "./index.js";

const cli = cac("nextjs-app-router-visualizer");

cli.help();

cli.option("this is test option", "This is test option", {
  default: "default",
});

await start();
