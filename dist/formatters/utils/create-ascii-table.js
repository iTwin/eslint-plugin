/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
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

module.exports = createAsciiTable;
