#!/usr/bin/env node

import { Command } from "commander";
import { version } from "../../package.json";

import Excel from "exceljs";
import OCX from "../";

import * as pipeline from "./pipeline-steps";

const program = new Command();

program
  .name("ocf2ocx")
  .description("Converts Open Cap Table Format JSON to Excel")
  .version(version)
  .showHelpAfterError()
  .argument("<src>", "Directory or .zip archive containing OCF Manifest File")
  .action((src) => {
    try {
      console.log(`* Searching ${src} for a manifest file`);
      const files = pipeline.extractFilesetFromPath(src);
      const ocfpkg = OCX.OCFPackage.createFromFileset(files);
      console.log(`- Found OCF Manifest File ${ocfpkg.manifestFile.path}`);

      const model = new OCX.Model(ocfpkg.asOfDate, ocfpkg.generatedAtTimestamp);
      console.log(`  Effective Date: ${model.asOfDate.toLocaleDateString()}`);

      const workbook = new Excel.Workbook();
      new OCX.Workbook(workbook);
      workbook.xlsx.writeFile("ocf2ocx.xlsx").then(() => {
        console.log("wrote to ocf2ocx.xlsx");
      });
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.error(e.message);
      } else {
        console.error("Unknown error occurred.");
      }
      process.exit(1);
    }
  });

program.parse();
