import fs from "node:fs";
import { parse } from "@babel/parser";

function getAST(filePath) {
  const code = fs.readFileSync(filePath, "utf-8");
  return parse(code, {
    sourceType: "module",
    plugins: ["jsx"],
  });
}

const ALLOWED_EXTENSIONS = ["tsx", "jsx", "js", "ts"];

function isAllowedFile(fileName) {
  const [name, extension] = fileName.split(".");
  return name === "page" && ALLOWED_EXTENSIONS.includes(extension);
}

const start = async () => {
  const files = fs.readdirSync("./app");
  files.forEach((file) => {
    if (!isAllowedFile(file)) {
      return;
    }
    const ast = getAST(`./app/${file}`);
    console.log(ast);
  });
};

export default start;
