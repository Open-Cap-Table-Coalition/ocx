#!/usr/bin/env node

import { Command } from "commander";
import { version } from "../../package.json";

import Excel from "exceljs";
import ExcelJSWriter from "../../src/workbook/exceljs-writer";

import OCX from "../../src";

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
      OCX.Logger.info(`* Searching ${src} for a manifest file`);
      const files = pipeline.extractFilesetFromPath(src);
      const ocfpkg = OCX.OCFPackage.createFromFileset(files);
      OCX.Logger.info("- Found OCF Manifest File", ocfpkg.manifestFile.path);

      const model = new OCX.Model(ocfpkg.asOfDate, ocfpkg.generatedAtTimestamp);
      OCX.Logger.info(
        "  Effective Date: ",
        model.asOfDate.toLocaleDateString()
      );

      for (const object of ocfpkg.objects()) {
        model.consume(object);
      }

      const workbook = new Excel.Workbook();
      new OCX.Workbook(new ExcelJSWriter(workbook), model);
      workbook.xlsx.writeFile("ocf2ocx.xlsx").then(() => {
        OCX.Logger.info("wrote to ocf2ocx.xlsx");
      });
    } catch (e: unknown) {
      if (e instanceof Error) {
        OCX.Logger.error(e.message);
      } else {
        OCX.Logger.error("Unknown error occurred.");
      }
      process.exit(1);
    }
  });

program.parse();
