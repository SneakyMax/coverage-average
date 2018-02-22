#!/usr/bin/env node
const program = require("commander");
const path = require("path");
const fileOrStdin = require("file-or-stdin");
const chalk = require("chalk");

program
  .usage("[options] <file>")
  .version("0.0.1")
  .option(
    "-l, --limit <limit>",
    "Threshold below which the coverage average must not fall",
    parseFloat
  )
  .parse(process.argv);

const file = program.args[0];
if (file && !path.isAbsolute(file)) {
  file = path.join(process.cwd(), file);
}

fileOrStdin(file)
  .then(function(rawData) {
    const data = rawData.toString();
    const statements = /Statements\s+:\s+([0-9\.]+)%/.exec(data);
    if (!statements) {
      throw new Error("Statements line does not exist");
    }
    const branches = /Branches\s+:\s+([0-9\.]+)%/.exec(data);
    if (!branches) {
      throw new Error("Branches line does not exist");
    }
    const functions = /Functions\s+:\s+([0-9\.]+)%/.exec(data);
    if (!functions) {
      throw new Error("Functions line does not exist");
    }
    const lines = /Lines\s+:\s+([0-9\.]+)%/.exec(data);
    if (!lines) {
      throw new Error("Lines line does not exist");
    }

    return [
      parseFloat(statements[1]),
      parseFloat(branches[1]),
      parseFloat(functions[1]),
      parseFloat(lines[1])
    ];
  })
  .then(coverage => {
    return (
      coverage.reduce((total, item) => total + item, 0) / coverage.length
    ).toFixed(2);
  })
  .then(average => {
    if (program.limit) {
      if (average < program.limit) {
        const fail =
          chalk.red.bold("FAIL") +
          " Coverage average of " +
          chalk.red.bold("%s%") +
          " is below limit of " +
          chalk.bold("%s%");
        console.error(fail, average, program.limit.toFixed(2));
        process.exit(1);
      }
      const pass =
        chalk.green.bold("PASS") +
        " Coverage average of " +
        chalk.green.bold("%s%") +
        " is above limit of " +
        chalk.bold("%s%");
      console.log(pass, average, program.limit.toFixed(2));
      process.exit(0);
    } else {
      console.log("Coverage average is %s%", average);
      process.exit(0);
    }
  })
  .catch(function(error) {
    if (error.code === "ENOENT") {
      console.error("%s does not exist", file);
      process.exit(1);
    }

    console.error(error);
    process.exit(1);
  });
