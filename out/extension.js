"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = require("vscode");
function activate(context) {
    context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider({
        scheme: "file",
        language: "4gl",
    }, new SwmfConfigDocumentSymbolProvider()));
}
exports.activate = activate;
class SwmfConfigDocumentSymbolProvider {
    formatFunc(cmd) {
        return cmd
            .replace(/^ *function /i, "")
            .replace(/\(.*/, "")
            .trim();
    }
    formatRep(cmd) {
        return cmd
            .replace(/^ *report /i, "")
            .replace(/\(.*/, "")
            .trim();
    }
    formatTable(cmd) {
        return cmd
            .replace(/i(\w+)\\s+temp table\\s+/gi, "")
            .trim();
    }
    formatIntoTable(cmd) {
        return cmd
            .replace(/i(\w+)\\s+into temp\\s+/gi, "")
            .trim();
    }
    provideDocumentSymbols(document, _token) {
        return new Promise((resolve) => {
            let symbols = [];
            let nodes = [symbols];
            let key = vscode.SymbolKind.Key;
            let tbd = vscode.SymbolKind.Enum;
            let func = vscode.SymbolKind.Function;
            for (var i = 0; i < document.lineCount; i++) {
                var line = document.lineAt(i);
                if (line.text.match(/^ *function /i)) {
                    let marker_symbol = new vscode.DocumentSymbol(this.formatFunc(line.text), "", func, line.range, line.range);
                    nodes[nodes.length - 1].push(marker_symbol);
                }
                else if (line.text.match(/^ *report /i)) {
                    let marker_symbol = new vscode.DocumentSymbol(this.formatRep(line.text), "Report", func, line.range, line.range);
                    nodes[nodes.length - 1].push(marker_symbol);
                }
                else if (line.text.includes("temp table")) {
                    let marker_symbol = new vscode.DocumentSymbol(this.formatTable(line.text), "temp table", tbd, line.range, line.range);
                    nodes[nodes.length - 1].push(marker_symbol);
                }
                else if (line.text.includes("INTO TEMP")) {
                    let marker_symbol = new vscode.DocumentSymbol(this.formatIntoTable(line.text), "temp table", tbd, line.range, line.range);
                    nodes[nodes.length - 1].push(marker_symbol);
                }
                else if (line.text.startsWith("MAIN")) {
                    let marker_symbol = new vscode.DocumentSymbol("MAIN", "MAIN statement", func, line.range, line.range);
                    nodes[nodes.length - 1].push(marker_symbol);
                }
                else if (line.text.startsWith("GLOBALS")) {
                    let marker_symbol = new vscode.DocumentSymbol("GLOBALS", "", key, line.range, line.range);
                    nodes[nodes.length - 1].push(marker_symbol);
                }
            }
            resolve(symbols);
        });
    }
}
//# sourceMappingURL=extension.js.map