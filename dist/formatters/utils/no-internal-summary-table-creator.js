/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
const path = require('path');
const fs = require('fs');
const process = require('process');
const createAsciiTable = require('./create-ascii-table');

/**
 * Generates a summary table and optionally a CSV from linting messages for a specific rule.
 * 
 * This function processes an array of linting messages, filters them by a specified rule ID,
 * and then generates a summary table and optionally a CSV file based on these messages. 
 * 
 * The summary table is always created and returned while the CSV file is created only if the 
 * `createCSV` flag is set to `true`.
 * 
 * @param {Object[]} messages - An array of linting message objects to be processed.
 * @param {string} ruleId - The ID of the linting rule to filter messages by.
 * @param {boolean} [createCSV=true] - A boolean flag indicating whether to create a CSV file (`true`) 
 *                                     or not. Defaults to `true`.
 * @returns {string} The generated summary table as a string.
 */
module.exports = function(messages, ruleId, createCSV = true) {
  const problemFiles = new Map();
  const errorTracker = new Map();
  const tagViolationsTracker = new Map();
  const currentWorkingDirectory = process.cwd();
  const maxCellWidth = 60;
  // Ensure the current working directory ends with a path separator
  const cwdWithSeparator = currentWorkingDirectory.endsWith(path.sep) ? currentWorkingDirectory : currentWorkingDirectory + path.sep;

  messages.forEach((message) => {
    const errorMessage = message.text ?? message.message;
    // parse the kind, name, and tag from the error message without using a regex pattern
      const messageSplit = errorMessage.split(' is ');
      const tag = messageSplit[1].replace('.', '');
      const secondMessageSplit = messageSplit[0].split(' ');
      const kind = secondMessageSplit[0];
      const name = secondMessageSplit[1].replace(/"/g, '');
      const filePath = message.location?.file ?? message.filePath;
      const relativeFilePath = filePath.replace(cwdWithSeparator, '');
      const problemFileMapKey = `${relativeFilePath};;${tag}`;
      const fileDetails = problemFiles.get(problemFileMapKey) ?? { locations: "" , count: 0};
      const newLocations = fileDetails.locations + `${message.location?.line ?? message.line}:${message.location?.column ?? message.column},`;
      problemFiles.set(problemFileMapKey, { locations: newLocations , count: fileDetails.count + 1});

      const key = `${kind};;${name};;${tag}`;
      const currentCount = errorTracker.get(key) ?? 0;
      const newCount = currentCount + 1;
      errorTracker.set(key, newCount);

      const tagViolationCount = tagViolationsTracker.get(tag) ?? 0;
      tagViolationsTracker.set(tag, tagViolationCount + 1);
  });

    if (problemFiles.size === 0 || errorTracker.size === 0 || tagViolationsTracker.size === 0)
      return '';

    // iterate over the problemFiles and for each value, remove the last comma from locations
    for (const [key, value] of problemFiles.entries()) {
      const locations = value.locations.slice(0, -1);
      problemFiles.set(key, { locations, count: value.count});
    }

    const filesSummaryRows = [
      ['File', 'Locations', 'Tag', '# of Occurrences'],
      ...Array.from(problemFiles.entries()).map(([filePath, { locations, count }]) => {
        const [relativeFilePath, tag] = filePath.split(';;');
        return [relativeFilePath, locations, tag, count];
      })
    ];
    const filesSummaryTable = createAsciiTable(filesSummaryRows, maxCellWidth);

    const rows = [
      ["Kind and Name", "Tag", "# of Occurrences"],
      ...Array.from(errorTracker.entries()).map(([key, value]) => {
        const [kind, name, tag] = key.split(";;");
        return [`${kind} ${name}`, tag, value];
      })

    ];
    const summaryTable = createAsciiTable(rows, maxCellWidth);

    const tagViolationsRows = [
      ["Tag", "# of Occurrences"],
      ...Array.from(tagViolationsTracker.entries()).map(([tag, value]) => [tag, value]),
    ];
    const tagViolationsTable = createAsciiTable(tagViolationsRows, maxCellWidth);
    // create a csv of the 2D arrays problemFiles and errorTracker and save that csv file in the current working directory
    // Convert 2D arrays to CSV format
    const problemFilesCSV = Array.from(problemFiles.entries()).map(([filePath, { locations, count }]) => {
      const [relativeFilePath, tag] = filePath.split(';;');
      return `${relativeFilePath},"${locations}",${tag},${count}`;
    }).join('\n');
    const errorTrackerCSV = Array.from(errorTracker.entries()).map(([key, value]) => {
      const [kind, name, tag] = key.split(";;");
      return `${kind} ${name},${tag},${value}`;
    }).join('\n');
    const tagViolationsCSV = Array.from(tagViolationsTracker.entries()).map(([tag, value]) => `${tag},${value}`).join('\n');

    const allTablesSummaryTitle = `Summary tables for '${ruleId}' lint rule violations:`;
    const problemFilesTitle = `'${ruleId}' violations summary table by files:`;
    const errorTrackerTitle = `'${ruleId}' violations summary table by kind and name:`;
    const tagViolationsTitle = `'${ruleId}' violations summary table by tags:`;

    // Combine problemFilesCSV and errorTrackerCSV
    const combinedCSV = `${allTablesSummaryTitle}\n\n${errorTrackerTitle}\nKind and Name,Tag,# of Occurrences\n${errorTrackerCSV}\n\n${problemFilesTitle}\nFile,Locations,Tag,# of Occurrences\n${problemFilesCSV}\n\n${tagViolationsTitle}\nTag,# of Occurrences\n${tagViolationsCSV}\n`;

    // Save the CSV file in the current working directory
    if (createCSV)
      fs.writeFileSync('no-internal-summary.csv', combinedCSV);

    return `${allTablesSummaryTitle}\n${errorTrackerTitle}\n${summaryTable}\n${problemFilesTitle}\n${filesSummaryTable}\n${tagViolationsTitle}\n${tagViolationsTable}\n`;
};
