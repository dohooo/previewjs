const path = require("path");
const { build } = require("esbuild");

build({
  entryPoints: ["./src/index.ts"],
  minify: false,
  bundle: true,
  outfile: "./dist/index.js",
  external: ["esbuild", "fsevents"],
  platform: "node",
}).catch((err) => {
  process.stderr.write(err.stderr);
  process.exit(1);
});
