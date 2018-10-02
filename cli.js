#!/usr/bin/env node
const fs = require("fs");
const cmd = require("node-cmd");
const chalk = require("chalk");
const inquirer = require("inquirer");

// Filenames
const tempLog = "tempLog.txt";
const changeLog = "Changelog.md";

// Commit Prefixes
let log = "";
let add = [];
let remove = [];
let improve = [];
let change = [];
let refactor = [];
let fix = [];

// User Parameters
let title = "";
let fromHash = "";
let toHash = "";
let isAppend = false;

Start();

// Get Required Parameters
function Start() {
  console.log(chalk.white.bold("\nSettings will ask Changelog details"));
  console.log("");
  inquirer
    .prompt([
      {
        message: "Milestone Title:",
        type: "input",
        name: "milestoneTitle",
        validate: validateTitle
      },
      {
        message: "From Commit Hash:",
        type: "input",
        name: "fromHash",
        validate: validateHash
      },
      {
        message: "To Commit Hash:",
        type: "input",
        name: "toHash",
        validate: validateHash
      },
      {
        message: "Append or Create As New Changelog?",
        type: "list",
        name: "isAppend",
        choices: ["Append", "Create"]
      },
      {
        message: "Are your settings correct?",
        type: "list",
        name: "isConfirmed",
        choices: ["Yes", "No"]
      }
    ])
    .then(answers => {
      if (answers.isConfirmed == "No") {
        Start();
      } else {
        title = answers.milestoneTitle;
        fromHash = answers.fromHash;
        toHash = answers.toHash;

        if (answers.isAppend == "Append") isAppend = true;
        else isAppend = false;

        console.log("");
        RunCommand();
      }
    });
}

// Save Git Log Output To Temp Log File
function RunCommand() {
  // Generate Command
  let command =
    "git log --no-merges --date=short --oneline --pretty=format:'%s *`(#%h)`*' " +
    fromHash +
    "..." +
    toHash +
    " > tempLog.txt";

  // Run Command
  cmd.get(command, function(err, file, stderr) {
    console.log("");
    if (!err) {
      console.log(chalk.magenta("1. Running Git Log"));
      console.log("   " + command);
      ReadLog();
    } else {
      console.log(chalk.red("\n   Could not run command\n   " + err));
      // Remove Temp log
      fs.unlink("tempLog.txt", function(err) {
        if (err)
          return console.log(
            chalk.red("\n   Could not remove temporary log file\n   " + err)
          );
      });
    }
  });
}

// Read From Temp Log File
function ReadLog() {
  // Check Temp Log
  if (fs.existsSync(tempLog)) {
    // Read from Temp Log
    let lines = fs.readFileSync(tempLog, "utf8").split("\n");
    let lineCount = lines.length;
    let currentCount = 0;

    console.log(chalk.magenta("\n2. Reading Output"));
    console.log("   " + lineCount + " lines of commit");

    lines.forEach(line => {
      currentCount++;
      if (getFirstWord(line).includes("Add")) add.push(line);
      if (getFirstWord(line).includes("Remove")) remove.push(line);
      if (getFirstWord(line).includes("Improve")) improve.push(line);
      if (getFirstWord(line).includes("Change")) change.push(line);
      if (getFirstWord(line).includes("Refactor")) refactor.push(line);
      if (getFirstWord(line).includes("Fix")) fix.push(line);

      if (currentCount === lineCount) {
        console.log("   " + add.length + " adds");
        console.log("   " + improve.length + " improvements");
        console.log("   " + change.length + " changes");
        console.log("   " + refactor.length + " refactoring");
        console.log("   " + remove.length + " removes");
        console.log("   " + fix.length + " fixes");

        GenerateLogData();
      }
    });
    // If Temp Log does not exist, throw error
  } else {
    console.log(chalk.red("   Git log not found"));
  }
}

// Generate Formatted Log Data
function GenerateLogData() {
  console.log(chalk.magenta("\n3. Generating Data"));

  log += "\n# " + title;
  log +=
    "\n**Showing Commits Between `" + fromHash + "` and `" + toHash + "`**\n";

  if (add.length > 0) log += "\n## Added\n";
  add.forEach(line => {
    log += formatLogEntry(line);
  });

  if (improve.length > 0) log += "\n## Improved\n";
  improve.forEach(line => {
    log += formatLogEntry(line);
  });

  if (change.length > 0) log += "\n## Changed\n";
  change.forEach(line => {
    log += formatLogEntry(line);
  });

  if (refactor.length > 0) log += "\n## Refactored\n";
  refactor.forEach(line => {
    log += formatLogEntry(line);
  });

  if (remove.length > 0) log += "\n## Removed\n";
  remove.forEach(line => {
    log += formatLogEntry(line);
  });

  if (fix.length > 0) log += "\n## Fixed\n";
  fix.forEach(line => {
    log += formatLogEntry(line);
  });

  console.log("   Done");
  SaveLog();
}

// Save Generated Data As Markdown
function SaveLog() {
  console.log(chalk.magenta("\n4. Saving Changelog"));

  // If Append Is True, Append To Changelog.md
  if (isAppend) {
    if (fs.existsSync(changeLog)) {
      console.log("   Appended into Changelog.md");
      fs.appendFileSync(changeLog, log);
    }
    // If Append Is False, Create A New Changelog
    else {
      console.log("   Changelog.md not found, saving as new");
      var stream = fs.createWriteStream(changeLog);
      stream.once("open", function(fd) {
        stream.write(log);
        stream.end();
      });
    }
  } else {
    console.log("   Saved as " + title + ".md");
    var stream = fs.createWriteStream(title + ".md");
    stream.once("open", function(fd) {
      stream.write(log);
      stream.end();
    });
  }

  // Remove Temp Git Log File
  fs.unlink("tempLog.txt", function(err) {
    if (err)
      return console.log(
        chalk.red("\n   Could not remove temporary log file\n   " + err)
      );
  });
}

// Log Entry Format
function formatLogEntry(line) {
  return "- " + line + "\n";
}

// Get The First Word For Checking Prefixes
function getFirstWord(str) {
  let spacePosition = str.indexOf(" ");
  if (spacePosition === -1) return str;
  else return str.substr(0, spacePosition);
}

// Validate Changelog Title
function validateTitle(str) {
  if (str === undefined) return false;

  if (str === "") return false;

  return true;
}

// Validate Commit Hash
function validateHash(str) {
  if (str === undefined) return false;

  if (str.length < 7) return false;

  if (str.match("[^a-z A-Z 0-9_]")) return false;

  return true;
}