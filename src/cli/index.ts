#!/usr/bin/env node

import { Command } from "commander";
import { version } from "../../package.json";

const program = new Command();

program
  .name("ocf2ocx")
  .description("Converts Open Cap Table Format JSON to Excel")
  .version(version)
  .showHelpAfterError()
  .argument("<src>", "Directory or .zip archive containing OCF Manifest File")
  .action((/* src */) => {
    console.log("TODO");
  });

program.parse();
