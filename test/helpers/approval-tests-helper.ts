import Excel from "exceljs";
import odiff from "odiff";
import fs from "fs";

class ApprovalTestHelper {
  private approvalFolderPath: string;

  constructor() {
    this.approvalFolderPath = "test/fixtures/approvals-fixtures/";
  }

  public async approveExcel(
    testName: string,
    excel: Excel.Workbook
  ): Promise<odiff.odiffResult[]> {
    const approved = new Excel.Workbook();
    approved.addWorksheet("Test Sheet");
    const approvalFileName = `${testName}Approved.xlsx`;
    const receivedFileName = `${testName}Received.xlsx`;
    const differences: odiff.odiffResult[] = [];

    // if approvals folder doesnt exist, create it
    if (!fs.existsSync(this.approvalFolderPath)) {
      fs.mkdirSync(this.approvalFolderPath);
    }
    /* if approved file doesn't exist create it,
    then create the received file and compare.
    otherwise read the approved file and compare to
    the workbook passed in parameter
    */
    if (!fs.existsSync(`${this.approvalFolderPath}${approvalFileName}`)) {
      approved.xlsx.writeFile(`${this.approvalFolderPath}${approvalFileName}`);
      excel.xlsx.writeFile(`${this.approvalFolderPath}${receivedFileName}`);
      differences.push({
        type: "set",
        path: [],
        val: "",
      });
    } else {
      await approved.xlsx.readFile(
        `${this.approvalFolderPath}${approvalFileName}`
      );
      excel.eachSheet((receivedSheet, sheetId) => {
        const approvedSheet = approved.getWorksheet(sheetId);
        if (approvedSheet) {
          receivedSheet.eachRow({ includeEmpty: true }, (row1, rowNumber) => {
            approvedSheet
              .getRow(rowNumber)
              .eachCell({ includeEmpty: true }, (cell2, colNumber) => {
                const cell1 = row1.getCell(colNumber);
                if ("sharedFormula" in cell1.model) {
                  delete cell1.model.sharedFormula;
                }
                if ("result" in cell1.model) {
                  delete cell1.model.result;
                }
                differences.push(...odiff(cell1.model, cell2.model));
              });
          });
        } else {
          differences.push({
            type: "set",
            path: [],
            val: "",
          });
        }
      });

      if (differences.length > 0) {
        excel.xlsx.writeFile(`${this.approvalFolderPath}${receivedFileName}`);
      } else {
        if (fs.existsSync(`${this.approvalFolderPath}${receivedFileName}`)) {
          fs.unlinkSync(`${this.approvalFolderPath}${receivedFileName}`);
          console.log("Received file removed!");
        }
      }
    }

    return differences;
  }
}

export default ApprovalTestHelper;
