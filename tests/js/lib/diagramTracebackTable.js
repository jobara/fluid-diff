/* eslint-env node */
"use strict";
var fluid = fluid || require("infusion");
fluid.registerNamespace("fluid.test.diff");

var window   = require("svgdom");
var svg      = require("svg.js")(window);
var document = window.document;

/**
 * Diagram a traceback table using ASCII characters.
 *
 * @param {Array} leftValue - An array of values.
 * @param {Array} rightValue - An array that was compared to `leftValue`.
 * @param {Array} tracebackTable - A grid of "traceback" results generated by comparing `leftValue` (y-axis) to `rightValue` (x-axis).
 * @return {String} - An ASCII representation of the traceback table.
 *
 */
fluid.test.diff.diagramTracebackAsText = function (leftValue, rightValue, tracebackTable) {
    var dividerString =  "-".repeat((rightValue.length + 1) * 7) + "\n";
    var tableString = dividerString + "|     |";
    fluid.each(rightValue, function (value) {
        tableString += "|   " + value + " |";
    });
    tableString += "\n";
    fluid.each(tracebackTable, function (row, rowIndex) {
        tableString += dividerString;
        var rowString = "|  " + leftValue[rowIndex] + "  |";
        fluid.each(row, function (cell) {
            var cellString = fluid.test.diff.diagramCell(cell);
            rowString += "| " + cellString + " |";
        });
        rowString += "\n";
        tableString += rowString;
    });
    tableString += dividerString;
    return tableString;
};

fluid.test.diff.diagramCell = function (cell, options) {
    var noArrowMarker   = fluid.get(options, "noArrowMarker")   || " *";
    var leftMarker      = fluid.get(options, "leftMarker")      || "_ ";
    var upMarker        = fluid.get(options, "upMarker")        || " |";
    var upperLeftMarker = fluid.get(options, "upperLeftMarker") || " \\";
    var leftAndUpMarker = fluid.get(options, "leftAndUpMarker") || "_|";

    var directionMarker = noArrowMarker;

    if (cell.fromUpperLeft) {
        directionMarker = upperLeftMarker;
    }
    else if (cell.fromLeft && cell.fromAbove) {
        directionMarker = leftAndUpMarker;
    }
    else if (cell.fromLeft) {
        directionMarker = leftMarker;
    }
    else if (cell.fromAbove) {
        directionMarker = upMarker;
    }
    return directionMarker + cell.matchLength;
};

/**
 *
 * Diagram a traceback table in SVG format.
 *
 * @param {Array} leftValue - An array of values.
 * @param {Array} rightValue - An array that was compared to `leftValue`.
 * @param {Array} tracebackTable - A grid of "traceback" results generated by comparing `leftValue` (y-axis) to `rightValue` (x-axis).
 * @param {Object} [options] - An optional array of configuration options.
 * @return {String} - An SVG representation of the traceback table as XML text.
 *
 */
fluid.test.diff.diagramTracebackAsSvg = function (leftValue, rightValue, tracebackTable, options) {
    var cellDiagramOptions = {
        noArrowMarker:   "╳ ",
        leftMarker:      "← ",
        upMarker:        "↑ ",
        upperLeftMarker: "↖ ",
        leftAndUpMarker: "←↑"
    };
    var drawing = svg(document.documentElement);
    var title = fluid.get(options, "title");
    if (title) {
        drawing.element("title").words(title);
        drawing.attr("aria-labelledby", "title");
    }

    var cellHeight = fluid.get(options, "cellHeight") || 48;
    var cellWidth  = fluid.get(options, "cellWidth")  || 72;

    drawing.height(cellHeight * (leftValue.length + 1));
    drawing.width(cellWidth * (rightValue.length + 1));

    // Draw column headings.
    fluid.each(rightValue, function (columnHeading, index) {
        var columnHeadingXOffset = ((index + 1) * cellWidth);
        var drawnColumnHeadingText = drawing.text(columnHeading);
        var bbox = drawnColumnHeadingText.bbox();
        var textXOffset   = (columnHeadingXOffset + (cellWidth  / 2)) - (bbox.width / 2);
        var textYOffset   = (cellHeight / 2) - (bbox.height / 2);
        drawnColumnHeadingText.move(textXOffset, textYOffset);
    });

    for (var row = 0; row < tracebackTable.length; row++) {
        var yOffset = (row * cellHeight) + cellHeight;

        // Draw row heading.
        var rowHeaderText = leftValue[row];
        var rowHeaderDrawnText = drawing.text(rowHeaderText);
        var rowHeaderBbox = rowHeaderDrawnText.bbox();
        var rowHeaderXOffset   = (cellWidth  / 2) - (rowHeaderBbox.width / 2);
        var rowHeaderYOffset   = (yOffset + (cellHeight / 2)) - (rowHeaderBbox.height / 2);
        rowHeaderDrawnText.move(rowHeaderXOffset, rowHeaderYOffset);

        // Draw row cells.
        for (var col = 0; col < tracebackTable[row].length; col++) {
            var columnHeadingXOffset = ((col + 1) * cellWidth);
            var cellHints = fluid.get(options, ["cellHints", row, col]);
            var rect = drawing.rect(cellWidth, cellHeight).move(columnHeadingXOffset, yOffset).fill({ color: "#fff" });
            if (cellHints) {
                var hintKeys = Object.keys(cellHints);
                for (var hintIndex = 0; hintIndex < hintKeys.length; hintIndex++) {
                    var hintFn = hintKeys[hintIndex];
                    var hintOptions = cellHints[hintFn];
                    rect[hintFn](hintOptions);
                }
            }
            rect.attr("aria-hidden", "true");
            var tracebackCell = tracebackTable[row][col];
            var cellText      = fluid.test.diff.diagramCell(tracebackCell, cellDiagramOptions);
            var drawnText = drawing.text(cellText);

            // Highlight matching segments in bold.
            if (tracebackCell.fromUpperLeft) {
                drawnText.font({ weight: "bolder"});
            };

            // Center the text in its cell.
            var bbox = drawnText.bbox();
            var textXOffset   = (columnHeadingXOffset + (cellWidth  / 2)) - (bbox.width / 2);
            var textYOffset   = (yOffset + (cellHeight / 2)) - (bbox.height / 2);
            drawnText.move(textXOffset, textYOffset);
        }
    }

    return drawing.svg();
};
