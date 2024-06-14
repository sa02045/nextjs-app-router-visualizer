#!/usr/bin/env node

import cac from "cac";
import { start } from "./index.js";

const cli = cac("nextjs-app-router-visualizer");

cli.help();

cli.option("--entry -e <entry>", "Entry file path");

const parsed = cli.parse();

const { entry, e } = parsed.options;

start({
  entryPagePath: entry || e,
});
