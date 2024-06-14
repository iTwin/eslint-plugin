const path = require('path');
const fs = require('fs');

module.exports = function(messages, ruleId) {
  const problemFiles = new Map();
  const errorTracker = new Map();
  const tagViolationsTracker = new Map();
  const currentWorkingDirectory = process.cwd();
  const maxCellWidth = 60;
  // Ensure the current working directory ends with a path separator
  const cwdWithSeparator = currentWorkingDirectory.endsWith(path.sep) ? currentWorkingDirectory : currentWorkingDirectory + path.sep;

  function createAsciiTable(rows, maxCellWidth) {
    // Calculate column widths
    const colWidths = rows[0].map((_, i) => Math.min(Math.max(...rows.map(row => String(row[i]).length)), maxCellWidth));

    // Create row separator
    const rowSeparator = '+' + colWidths.map(width => '-'.repeat(width + 2)).join('+') + '+';

    // Split cell contents into lines
    const splitRows = rows.map(row => row.map((cell, i) => {
        const cellStr = String(cell);
        const lines = [];
        for (let j = 0; j < cellStr.length; j += maxCellWidth) {
            lines.push(cellStr.slice(j, j + maxCellWidth));
        }
        return lines;
    }));

    // Convert rows to strings
    const rowStrings = splitRows.map(row => {
        const numLines = Math.max(...row.map(cellLines => cellLines.length));
        const lines = Array(numLines).fill().map((_, i) =>
            '|' + row.map((cellLines, j) => ' ' + (cellLines[i] || '').padEnd(colWidths[j]) + ' ').join('|') + '|'
        );
        return lines.join('\n');
    });

    // Join everything together
    return rowSeparator + '\n' + rowStrings.join('\n' + rowSeparator + '\n') + '\n' + rowSeparator;
}

  messages.forEach((message) => {
    const errorMessage = message.text ?? message.message;
    // regex pattern for error message for no internal violations
    const re = new RegExp('(.*) "(.*)" is (.*).');
    const match = errorMessage.match(re);
    if (match) {
    const [, kind, name, tag] = match
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
    }
  });

    if (problemFiles.size === 0 || errorTracker.size === 0)
      return;

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
    const combinedCSV = `${allTablesSummaryTitle}\n\n${errorTrackerTitle}\nKind and Name,Tag,# of Occurrences\n${errorTrackerCSV}\n\n${problemFilesTitle}\nFile,Locations,Tags\n${problemFilesCSV}\n\n${tagViolationsTitle}\nTag,# of Occurrences\n${tagViolationsCSV}\n`;

    // Save the CSV file in the current working directory
    fs.writeFileSync('no-internal-summary.csv', combinedCSV);

    return `${allTablesSummaryTitle}\n${errorTrackerTitle}\n${summaryTable}\n${problemFilesTitle}\n${filesSummaryTable}\n${tagViolationsTitle}\n${tagViolationsTable}\n`;
};
