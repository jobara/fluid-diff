/* eslint-env node */
"use strict";
var fluid = fluid || require("infusion");
fluid.logObjectRenderChars = 4098 * 1024;
var gpii = fluid.registerNamespace("gpii");

var jqUnit = jqUnit || require("node-jqunit");

if (typeof require !== "undefined") {
    fluid.require("%gpii-diff");
    require("./testDefs-compareArrays");
}

jqUnit.module("Unit tests for array diff function...");


fluid.registerNamespace("gpii.test.diff.compareArrays");
gpii.test.diff.compareArrays.runAllTests = function (that) {
    fluid.each(that.options.testDefs.arrays, gpii.test.diff.compareArrays.runSingleTest);
};

gpii.test.diff.compareArrays.runSingleTest = function (testDef) {
    jqUnit.test(testDef.message, function () {
        if (testDef.expectedError) {
            jqUnit.expectFrameworkDiagnostic(testDef.message, function () {
                gpii.diff.compareArrays(testDef.leftValue, testDef.rightValue);
            }, fluid.makeArray(testDef.expectedError));
        }
        else {
            var result = gpii.diff.compareArrays(testDef.leftValue, testDef.rightValue);
            jqUnit.assertDeepEq("The results should be as expected...", testDef.expected, result);
        }
    });
};

fluid.defaults("gpii.test.diff.compareArrays", {
    gradeNames: ["gpii.test.diff.testDefs.compareArrays"],
    listeners: {
        "onCreate.runTests": {
            funcName: "gpii.test.diff.compareArrays.runAllTests",
            args:     ["{that}"]
        }
    }
});

gpii.test.diff.compareArrays();