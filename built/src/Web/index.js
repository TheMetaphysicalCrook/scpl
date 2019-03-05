"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import * as CodeMirror from "codemirror";
const index_1 = require("../../index");
const ParserData_1 = require("../ParserData");
const inputArea = document.getElementById("inputArea");
const messageArea = document.getElementById("messageArea");
const outputArea = document.getElementById("outputArea");
//@ts-ignore
const editor = ace.edit("editor");
const Range = ace.require("ace/range").Range;
editor.setTheme("ace/theme/ambiance");
editor.session.setMode("ace/mode/scpl");
// inputArea should keep its text from the browser
messageArea.value = "";
outputArea.value = "";
const downloadShortcutBtn = document.getElementById("downloadShortcutBtn");
let bufferToDownload;
let timeout;
let textMarks = [];
editor.getSession().on("change", () => {
    textMarks.forEach(mark => editor.getSession().removeMarker(mark));
    textMarks = [];
    messageArea.value = "";
    outputArea.value = "";
    if (timeout) {
        clearTimeout(timeout);
    }
    timeout = setTimeout(convert, 200);
});
console.log("Code loaded");
function downloadBlob(data, fileName, mimeType) {
    const blob = new Blob([data], {
        type: mimeType
    });
    const url = window.URL.createObjectURL(blob);
    downloadURL(url, fileName);
    setTimeout(() => {
        return window.URL.revokeObjectURL(url);
    }, 1000);
}
function downloadURL(data, fileName) {
    const a = document.createElement("a");
    a.href = data;
    a.download = fileName;
    // a.setAttribute("target", "_blank"); // breaks safari
    document.body.appendChild(a);
    a.style.display = "none";
    a.click();
    a.remove();
}
const time = () => (new Date).getTime();
document.getElementById("convertBtn").addEventListener("click", convert);
function convert() {
    messageArea.value = "Loading...";
    outputArea.value = "Loading...";
    textMarks.forEach(mark => editor.getSession().removeMarker(mark));
    textMarks = [];
    console.log("Converting...");
    let started = (new Date).getTime();
    let output;
    try {
        output = index_1.parse(editor.getValue() + "\n", { makePlist: true });
    }
    catch (er) {
        console.log(er);
        if (!(er instanceof ParserData_1.PositionedError)) {
            throw new Error("Not positioned");
        }
        console.log("Setting annotation at ");
        // new
        // ace.require("ace/range").range;
        editor.getSession().setAnnotations([{
                row: er.start[0] - 1,
                column: er.start[1] - 1,
                text: er.message,
                type: "error" // also warning and information
            }]);
        textMarks.push(editor.getSession().addMarker(new Range(er.start[0] - 1, er.start[1] - 1, er.end[0] - 1, er.end[1] - 1), "ace_active-line error", "background")); // ace_active-line
        messageArea.value = er.message + ". Errored in " + ((new Date).getTime() - started) + "ms";
        outputArea.value = er.message;
        return;
    }
    const buffer = output;
    bufferToDownload = buffer;
    messageArea.value = "Success in " + ((new Date).getTime() - started) + "ms";
    outputArea.value = "Success";
    // TODO (https://github.com/pine/arraybuffer-loader)
}
downloadShortcutBtn.addEventListener("click", () => {
    convert();
    if (bufferToDownload) {
        downloadBlob(bufferToDownload, "demoshortcut.shortcut", "application/x-octet-stream");
    }
});
convert();
