#!/usr/bin/env node

import type * as api from "@previewjs/api";
import {
  createWorkspace,
  findWorkspaceRoot,
  loadPreviewEnv,
  PersistedStateManager,
} from "@previewjs/core";
import reactPlugin from "@previewjs/plugin-react";
import solidPlugin from "@previewjs/plugin-solid";
import vue2Plugin from "@previewjs/plugin-vue2";
import vue3Plugin from "@previewjs/plugin-vue3";
import { createFileSystemReader } from "@previewjs/vfs";
// @ts-ignore
import setupEnvironment from "@previewjs/pro";
import chalk from "chalk";
import { program } from "commander";
import { readFileSync } from "fs";
import { prompt, registerPrompt } from "inquirer";
import autocompletePrompt from "inquirer-autocomplete-prompt";
import open from "open";

registerPrompt("autocomplete", autocompletePrompt);

const { version } = JSON.parse(
  readFileSync(`${__dirname}/../package.json`, "utf8")
);

program.version(version);

const PORT_OPTION = [
  "-p, --port <port>",
  "Port number on which to run the Preview.js server",
  "8120",
] as const;

interface SharedOptions {
  port: string;
}

const noComponentOption = chalk.blueBright("Skip component selection");
const forceRefreshOption = chalk.magenta("Refresh component list");

program
  .arguments("[dir-path]")
  .option(...PORT_OPTION)
  .action(async (dirPath: string | undefined, options: SharedOptions) => {
    const persistedStateManager: PersistedStateManager = {
      get: async (_, req) => {
        const cookie = req.cookies["state"];
        if (cookie) {
          return JSON.parse(cookie);
        }
        return {};
      },
      update: async (partialState, req, res) => {
        const existingCookie = req.cookies["state"];
        let existingState: api.PersistedState = {};
        if (existingCookie) {
          existingState = JSON.parse(existingCookie);
        }
        const state = {
          ...existingState,
          ...partialState,
        };
        res.cookie("state", JSON.stringify(state), {
          httpOnly: true,
          sameSite: "strict",
        });
        return state;
      },
    };
    const reader = createFileSystemReader({
      watch: true,
    });
    dirPath ||= process.cwd();
    const rootDirPath = findWorkspaceRoot(dirPath);
    if (!rootDirPath) {
      console.error(`Unable to find workspace root for ${dirPath}`);
      process.exit(1);
    }
    const loaded = await loadPreviewEnv({
      rootDirPath,
      setupEnvironment,
      frameworkPluginFactories: [
        reactPlugin,
        solidPlugin,
        vue2Plugin,
        vue3Plugin,
      ],
    });
    if (!loaded) {
      console.error(`Unable to detect supported framework in ${rootDirPath}`);
      process.exit(1);
    }
    const { previewEnv, frameworkPlugin } = loaded;
    const workspace = await createWorkspace({
      versionCode: `cli-${version}`,
      logLevel: "info",
      rootDirPath,
      reader,
      frameworkPlugin,
      middlewares: previewEnv.middlewares || [],
      persistedStateManager,
      onReady: previewEnv.onReady?.bind(previewEnv),
    });
    if (!workspace) {
      console.error(chalk.red(`No workspace detected.`));
      process.exit(1);
    }

    const port = parseInt(options.port);
    await promptComponent();

    async function promptComponent(forceRefresh = false): Promise<void> {
      console.log(`Analyzing project for components...`);
      const { components, cached } = await workspace!.components.list({
        forceRefresh,
      });
      if (cached) {
        console.log(`Using cached component list from previous run.`);
      }
      const allComponents = Object.entries(components)
        .map(([filePath, fileComponents]) =>
          fileComponents.map(({ componentName, exported }) => ({
            filePath,
            componentName,
            exported,
          }))
        )
        .flat();
      const { componentId } = await prompt([
        {
          type: "autocomplete",
          name: "componentId",
          message: "Select a component",
          source: (_: unknown, input = "") => [
            ...(!input ? [noComponentOption, forceRefreshOption] : []),
            ...allComponents
              .filter(
                ({ filePath, componentName }) =>
                  filePath.toLowerCase().includes(input.toLowerCase()) ||
                  componentName.toLowerCase().includes(input.toLowerCase())
              )
              .map(
                ({ filePath, componentName }) => `${filePath}:${componentName}`
              ),
          ],
        },
      ]);
      if (componentId === forceRefreshOption) {
        return promptComponent(true);
      }
      await workspace!.preview.start(async () => port);
      const pathSuffix =
        componentId === noComponentOption ? "" : `/?p=${componentId}`;
      await open(`http://localhost:${port}${pathSuffix}`);
    }
  });

program.parseAsync(process.argv).catch((e) => {
  console.error(e);
  process.exit(1);
});
