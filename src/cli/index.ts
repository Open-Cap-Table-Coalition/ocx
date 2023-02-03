#!/usr/bin/env node

import { Command } from "commander";
import { version } from "../../package.json";

import Excel from "exceljs";
import OCX from "../";

const program = new Command();

program
  .name("ocf2ocx")
  .description("Converts Open Cap Table Format JSON to Excel")
  .version(version)
  .showHelpAfterError()
  .argument("<src>", "Directory or .zip archive containing OCF Manifest File")
  .action((/* src */) => {
    const workbook = new Excel.Workbook();
    new OCX.Workbook(workbook);
    workbook.xlsx.writeFile("ocf2ocx.xlsx").then(() => {
      console.log("wrote to ocf2ocx.xlsx");
    });
  });

program.parse();
