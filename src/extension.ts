import * as vscode from 'vscode';
import * as path from 'path';

// ─── Data: Built-in keywords, functions, types for Informix 4GL ───

const BUILTIN_FUNCTIONS: { name: string; signature: string; doc: string }[] = [
  // 4GL Library Functions
  { name: "ARG_VAL", signature: "ARG_VAL(index INTEGER)", doc: "Returns the command-line argument at the specified index as a string." },
  { name: "ARR_COUNT", signature: "ARR_COUNT()", doc: "Returns the number of rows entered in a screen array (SMALLINT)." },
  { name: "ARR_CURR", signature: "ARR_CURR()", doc: "Returns the current row in the program array (SMALLINT)." },
  { name: "DOWNSHIFT", signature: "DOWNSHIFT(source CHAR)", doc: "Converts all uppercase letters in the string to lowercase." },
  { name: "ERR_GET", signature: "ERR_GET(error_num INTEGER)", doc: "Returns the error message text for the given Informix error number." },
  { name: "ERR_PRINT", signature: "ERR_PRINT(error_num INTEGER)", doc: "Displays the error message for the given Informix error number." },
  { name: "ERR_QUIT", signature: "ERR_QUIT(error_num INTEGER)", doc: "Displays the error message and exits the program." },
  { name: "ERRORLOG", signature: "ERRORLOG(message CHAR)", doc: "Writes a message to the error log file (opened with STARTLOG)." },
  { name: "FGL_DRAWBOX", signature: "FGL_DRAWBOX(height INT, width INT, row INT, col INT [, color INT])", doc: "Draws a box on the screen at the specified position." },
  { name: "FGL_GETENV", signature: "FGL_GETENV(name CHAR)", doc: "Returns the value of the specified environment variable." },
  { name: "FGL_GETKEY", signature: "FGL_GETKEY()", doc: "Waits for a keypress and returns the key code (INTEGER)." },
  { name: "FGL_KEYVAL", signature: "FGL_KEYVAL(keyname CHAR)", doc: "Returns the integer key code for the specified key name." },
  { name: "FGL_LASTKEY", signature: "FGL_LASTKEY()", doc: "Returns the integer key code of the last key pressed." },
  { name: "FGL_SCR_SIZE", signature: "FGL_SCR_SIZE(arrayname CHAR)", doc: "Returns the screen array size for the named array." },
  { name: "FGL_SETCURRLINE", signature: "FGL_SETCURRLINE(line INT, array_line INT)", doc: "Sets the current screen line and program array line." },
  { name: "FIELD_TOUCHED", signature: "FIELD_TOUCHED(fieldname [, ...])", doc: "Returns TRUE if any of the specified fields have been modified by the user." },
  { name: "GET_FLDBUF", signature: "GET_FLDBUF(fieldname [, ...])", doc: "Returns the current contents of the specified screen field(s) as a string." },
  { name: "INFIELD", signature: "INFIELD(fieldname)", doc: "Returns TRUE if the cursor is currently in the specified field." },
  { name: "LENGTH", signature: "LENGTH(source CHAR)", doc: "Returns the number of characters in the string, including trailing blanks (SMALLINT)." },
  { name: "NUM_ARGS", signature: "NUM_ARGS()", doc: "Returns the number of command-line arguments (SMALLINT)." },
  { name: "ORD", signature: "ORD(source CHAR)", doc: "Returns the integer (ASCII) value of the first character in the string." },
  { name: "SCR_LINE", signature: "SCR_LINE()", doc: "Returns the current row in the screen array (SMALLINT)." },
  { name: "SET_COUNT", signature: "SET_COUNT(count INTEGER)", doc: "Sets the number of rows for a screen array INPUT or DISPLAY ARRAY." },
  { name: "SHOWHELP", signature: "SHOWHELP(help_num INTEGER)", doc: "Displays help message number from the help file." },
  { name: "STARTLOG", signature: "STARTLOG(filename CHAR)", doc: "Opens the specified file for error logging." },
  { name: "UPSHIFT", signature: "UPSHIFT(source CHAR)", doc: "Converts all lowercase letters in the string to uppercase." },
  // SQL Aggregate Functions
  { name: "AVG", signature: "AVG(expression)", doc: "Returns the average of values in the expression (SQL aggregate)." },
  { name: "COUNT", signature: "COUNT(* | expression)", doc: "Returns the count of rows or non-null values (SQL aggregate)." },
  { name: "MAX", signature: "MAX(expression)", doc: "Returns the maximum value (SQL aggregate)." },
  { name: "MIN", signature: "MIN(expression)", doc: "Returns the minimum value (SQL aggregate)." },
  { name: "SUM", signature: "SUM(expression)", doc: "Returns the sum of values (SQL aggregate)." },
  // Date/Time Functions
  { name: "DATE", signature: "DATE(expression)", doc: "Converts the expression to a DATE value." },
  { name: "DAY", signature: "DAY(date_expression)", doc: "Extracts the day of the month from a DATE or DATETIME." },
  { name: "MDY", signature: "MDY(month INT, day INT, year INT)", doc: "Returns a DATE value from month, day, and year integers." },
  { name: "MONTH", signature: "MONTH(date_expression)", doc: "Extracts the month from a DATE or DATETIME." },
  { name: "WEEKDAY", signature: "WEEKDAY(date_expression)", doc: "Returns the day of the week (0=Sunday .. 6=Saturday)." },
  { name: "YEAR", signature: "YEAR(date_expression)", doc: "Extracts the year from a DATE or DATETIME." },
  { name: "EXTEND", signature: "EXTEND(datetime_expr, qualifier)", doc: "Adjusts the precision of a DATETIME or DATE value." },
  // Other Functions
  { name: "ASCII", signature: "ASCII(integer_expr)", doc: "Returns the character corresponding to the ASCII code." },
  { name: "DECODE", signature: "DECODE(expr, search1, result1 [, search2, result2 ...] [, default])", doc: "Compares expr to search values and returns the corresponding result." },
  { name: "NVL", signature: "NVL(expression, substitute)", doc: "Returns substitute if expression is NULL, otherwise returns expression." },
  { name: "CURSOR_NAME", signature: "CURSOR_NAME()", doc: "Returns the name of the current cursor in a FOREACH loop." },
  { name: "SQLEXIT", signature: "SQLEXIT(code INTEGER)", doc: "Closes the database connection and returns the specified exit code." },
  { name: "TRIM", signature: "TRIM(source CHAR)", doc: "Removes leading and trailing whitespace from a string." },
];

const KEYWORDS: string[] = [
  // Control flow
  "IF", "THEN", "ELSE", "END IF",
  "WHILE", "END WHILE",
  "FOR", "END FOR",
  "FOREACH", "END FOREACH",
  "CASE", "WHEN", "OTHERWISE", "END CASE",
  "RETURN", "EXIT", "CONTINUE", "GOTO", "LABEL",
  // Program structure
  "MAIN", "END MAIN",
  "FUNCTION", "END FUNCTION",
  "REPORT", "END REPORT",
  "GLOBALS", "END GLOBALS",
  // Declarations
  "DEFINE", "LET", "INITIALIZE", "CONSTANT",
  // Database
  "DATABASE",
  "SELECT", "INSERT", "UPDATE", "DELETE",
  "FROM", "WHERE", "AND", "OR", "NOT",
  "ORDER BY", "GROUP BY", "HAVING",
  "INTO", "INTO TEMP", "VALUES",
  "UNION", "UNION ALL", "DISTINCT",
  "BETWEEN", "LIKE", "MATCHES", "IN", "EXISTS",
  "IS NULL", "IS NOT NULL",
  "JOIN", "LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "OUTER JOIN", "CROSS JOIN",
  "ASC", "DESC",
  // Cursors
  "DECLARE", "CURSOR", "SCROLL CURSOR", "WITH HOLD",
  "OPEN", "FETCH", "CLOSE", "FREE",
  "PREPARE", "EXECUTE",
  // Transactions
  "BEGIN WORK", "COMMIT WORK", "ROLLBACK WORK",
  // I/O & Screen
  "DISPLAY", "DISPLAY BY NAME", "DISPLAY FORM",
  "INPUT", "INPUT BY NAME", "END INPUT",
  "CONSTRUCT", "CONSTRUCT BY NAME", "END CONSTRUCT",
  "MESSAGE", "ERROR", "PROMPT", "SLEEP",
  "CLEAR", "CLEAR FORM", "CLEAR SCREEN",
  // Windows/Forms/Menus
  "OPEN WINDOW", "CLOSE WINDOW", "CURRENT WINDOW",
  "OPEN FORM", "CLOSE FORM",
  "MENU", "COMMAND", "END MENU",
  "OPTIONS",
  // Report
  "OUTPUT", "FORMAT",
  "START REPORT", "FINISH REPORT",
  "PAGE HEADER", "PAGE TRAILER",
  "FIRST PAGE HEADER",
  "BEFORE GROUP OF", "AFTER GROUP OF",
  "ON EVERY ROW", "ON LAST ROW",
  "PRINT", "SKIP", "COLUMN",
  "TOP MARGIN", "BOTTOM MARGIN", "LEFT MARGIN", "RIGHT MARGIN", "PAGE LENGTH",
  // Error handling
  "WHENEVER ERROR CONTINUE", "WHENEVER ERROR STOP",
  "WHENEVER ERROR CALL", "WHENEVER ANY ERROR CONTINUE",
  "WHENEVER ANY ERROR STOP",
  "DEFER INTERRUPT", "DEFER QUIT",
  // Data manipulation
  "CALL", "RETURNING",
  "RUN",
  "LOAD", "UNLOAD",
  // Fields/Attributes
  "ATTRIBUTE", "ATTRIBUTES",
  "FIELD", "INFIELD", "NEXT FIELD",
  "BEFORE", "AFTER",
  "ON KEY",
  "BY NAME",
  "CLIPPED", "SPACES", "USING", "WORDWRAP",
];

const DATA_TYPES: string[] = [
  "CHAR", "VARCHAR", "NCHAR", "NVARCHAR", "STRING",
  "INTEGER", "INT", "SMALLINT", "BIGINT", "TINYINT", "SERIAL",
  "FLOAT", "SMALLFLOAT", "DOUBLE",
  "DECIMAL", "MONEY",
  "DATE", "DATETIME", "INTERVAL",
  "BYTE", "TEXT", "BOOLEAN",
  "RECORD", "END RECORD", "ARRAY", "LIKE", "OF",
];

const BUILTIN_VARIABLES: string[] = [
  "STATUS", "SQLCA", "SQLCODE", "SQLERRD", "SQLAWARN",
  "INT_FLAG", "QUIT_FLAG", "TODAY", "TIME", "CURRENT",
  "PAGENO", "LINENO", "NOTFOUND", "TRUE", "FALSE", "NULL",
];

const DISPLAY_ATTRIBUTES: string[] = [
  "BLACK", "BLUE", "CYAN", "GREEN", "MAGENTA", "RED", "WHITE", "YELLOW",
  "BOLD", "DIM", "INVISIBLE", "NORMAL", "REVERSE", "UNDERLINE", "BLINK",
  "BORDER",
];


// ─── Function Info parsed from workspace files ───

interface FunctionInfo {
  name: string;
  params: string[];
  file: string;
  line: number;
  detail: string;        // "FUNCTION" or "REPORT"
  defineBlock: string[];  // DEFINE lines after function declaration
}

let workspaceFunctions: Map<string, FunctionInfo> = new Map();
let indexReady = false;

// ─── Parse all .4gl files in workspace for function definitions ───

async function indexWorkspaceFunctions(): Promise<void> {
  workspaceFunctions.clear();

  const files = await vscode.workspace.findFiles('**/*.4gl', '**/node_modules/**');

  for (const fileUri of files) {
    await indexFile(fileUri);
  }

  indexReady = true;
}

async function indexFile(fileUri: vscode.Uri): Promise<void> {
  let doc: vscode.TextDocument;
  try {
    doc = await vscode.workspace.openTextDocument(fileUri);
  } catch {
    return;
  }

  const funcRegex = /^\s*(function|report)\s+(\w+)\s*\(([^)]*)\)/i;
  const filePath = fileUri.fsPath;

  for (let i = 0; i < doc.lineCount; i++) {
    const lineText = doc.lineAt(i).text;
    const match = lineText.match(funcRegex);
    if (match) {
      const detail = match[1].toUpperCase();
      const name = match[2];
      const rawParams = match[3].trim();
      const params = rawParams ? rawParams.split(/\s*,\s*/).map(p => p.trim()) : [];

      // Read DEFINE lines after function declaration to get parameter types
      const defineBlock: string[] = [];
      for (let j = i + 1; j < doc.lineCount && j < i + 50; j++) {
        const defLine = doc.lineAt(j).text.trim();
        if (/^\s*define\s+/i.test(defLine) || /^\s+\w+\s+\w+/i.test(defLine)) {
          defineBlock.push(defLine);
        } else if (defLine === '' || /^\s*#/.test(defLine) || /^\s*--/.test(defLine)) {
          continue;
        } else {
          break;
        }
      }

      const info: FunctionInfo = {
        name,
        params,
        file: filePath,
        line: i,
        detail,
        defineBlock,
      };

      workspaceFunctions.set(name.toLowerCase(), info);
    }
  }
}

// Parse parameter types from DEFINE block
function getParamTypes(funcInfo: FunctionInfo): Map<string, string> {
  const paramTypes = new Map<string, string>();
  const defineText = funcInfo.defineBlock.join('\n');
  // Match patterns like: DEFINE param1 INTEGER, param2 CHAR(20)
  // or: DEFINE param1, param2 INTEGER
  const lines = defineText.replace(/\bdefine\b/gi, '').split(/\n/);

  for (const line of lines) {
    const trimmed = line.trim().replace(/,$/, '');
    if (!trimmed) { continue; }

    // Try: var1 TYPE or var1, var2 TYPE
    const typeMatch = trimmed.match(/^([\w,\s]+?)\s+(CHAR|VARCHAR|INTEGER|INT|SMALLINT|BIGINT|FLOAT|SMALLFLOAT|DECIMAL|MONEY|DATE|DATETIME|INTERVAL|RECORD|ARRAY|LIKE|BYTE|TEXT|BOOLEAN|SERIAL)\b(.*)/i);
    if (typeMatch) {
      const vars = typeMatch[1].split(/\s*,\s*/);
      const type = typeMatch[2].toUpperCase() + (typeMatch[3] || '');
      for (const v of vars) {
        const vname = v.trim();
        if (vname) {
          paramTypes.set(vname.toLowerCase(), type.trim().replace(/,\s*$/, ''));
        }
      }
    }
  }
  return paramTypes;
}

function buildSignatureLabel(funcInfo: FunctionInfo): string {
  const paramTypes = getParamTypes(funcInfo);
  const paramLabels = funcInfo.params.map(p => {
    const type = paramTypes.get(p.toLowerCase());
    return type ? `${p} ${type}` : p;
  });
  return `${funcInfo.detail} ${funcInfo.name}(${paramLabels.join(', ')})`;
}


// ─── CompletionItemProvider ───

class Informix4GLCompletionProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): vscode.CompletionItem[] {
    const items: vscode.CompletionItem[] = [];
    const linePrefix = document.lineAt(position).text.substring(0, position.character).toUpperCase();

    // Workspace functions
    for (const [, funcInfo] of workspaceFunctions) {
      const item = new vscode.CompletionItem(funcInfo.name, vscode.CompletionItemKind.Function);
      item.detail = `${funcInfo.detail} (${path.basename(funcInfo.file)})`;
      const sig = buildSignatureLabel(funcInfo);
      item.documentation = new vscode.MarkdownString(`\`\`\`4gl\n${sig}\n\`\`\`\nDefined in \`${path.basename(funcInfo.file)}:${funcInfo.line + 1}\``);
      if (funcInfo.params.length > 0) {
        item.insertText = new vscode.SnippetString(`${funcInfo.name}($1)`);
      } else {
        item.insertText = new vscode.SnippetString(`${funcInfo.name}()`);
      }
      items.push(item);
    }

    // Built-in functions
    for (const func of BUILTIN_FUNCTIONS) {
      const item = new vscode.CompletionItem(func.name, vscode.CompletionItemKind.Function);
      item.detail = 'Built-in function';
      item.documentation = new vscode.MarkdownString(`\`\`\`4gl\n${func.signature}\n\`\`\`\n${func.doc}`);
      item.insertText = new vscode.SnippetString(`${func.name}($1)`);
      items.push(item);
    }

    // Keywords (only if not inside a string)
    for (const kw of KEYWORDS) {
      const item = new vscode.CompletionItem(kw, vscode.CompletionItemKind.Keyword);
      item.detail = 'Keyword';
      items.push(item);
    }

    // Data types (suggest after DEFINE or type contexts)
    if (/\b(DEFINE|CHAR|INTEGER|SMALLINT)\b/.test(linePrefix) || /\s+$/.test(linePrefix)) {
      for (const dt of DATA_TYPES) {
        const item = new vscode.CompletionItem(dt, vscode.CompletionItemKind.TypeParameter);
        item.detail = 'Data type';
        items.push(item);
      }
    }

    // Built-in variables
    for (const v of BUILTIN_VARIABLES) {
      const item = new vscode.CompletionItem(v, vscode.CompletionItemKind.Variable);
      item.detail = 'Built-in variable';
      items.push(item);
    }

    // Display attributes
    if (/\bATTRIBUT/i.test(linePrefix)) {
      for (const attr of DISPLAY_ATTRIBUTES) {
        const item = new vscode.CompletionItem(attr, vscode.CompletionItemKind.EnumMember);
        item.detail = 'Display attribute';
        items.push(item);
      }
    }

    return items;
  }
}


// ─── SignatureHelpProvider ───

class Informix4GLSignatureHelpProvider implements vscode.SignatureHelpProvider {
  provideSignatureHelp(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): vscode.SignatureHelp | undefined {
    const lineText = document.lineAt(position).text.substring(0, position.character);

    // Find the function call context: walk back to find unclosed '('
    let depth = 0;
    let funcEnd = -1;
    let commaCount = 0;

    for (let i = lineText.length - 1; i >= 0; i--) {
      const ch = lineText[i];
      if (ch === ')') { depth++; }
      else if (ch === '(') {
        if (depth === 0) {
          funcEnd = i;
          break;
        }
        depth--;
      } else if (ch === ',' && depth === 0) {
        commaCount++;
      }
    }

    if (funcEnd < 0) { return undefined; }

    // Extract function name before '('
    const before = lineText.substring(0, funcEnd).trim();
    const funcNameMatch = before.match(/(\w+)\s*$/);
    if (!funcNameMatch) { return undefined; }
    const funcName = funcNameMatch[1];

    // Check workspace functions first
    const wsFunc = workspaceFunctions.get(funcName.toLowerCase());
    if (wsFunc) {
      return this.buildSignatureHelp(wsFunc, commaCount);
    }

    // Check built-in functions
    const builtin = BUILTIN_FUNCTIONS.find(f => f.name.toLowerCase() === funcName.toLowerCase());
    if (builtin) {
      return this.buildBuiltinSignatureHelp(builtin, commaCount);
    }

    return undefined;
  }

  private buildSignatureHelp(funcInfo: FunctionInfo, activeParam: number): vscode.SignatureHelp {
    const help = new vscode.SignatureHelp();
    const sig = buildSignatureLabel(funcInfo);

    const sigInfo = new vscode.SignatureInformation(sig, `Defined in ${path.basename(funcInfo.file)}:${funcInfo.line + 1}`);

    const paramTypes = getParamTypes(funcInfo);
    for (const p of funcInfo.params) {
      const type = paramTypes.get(p.toLowerCase());
      const label = type ? `${p} ${type}` : p;
      sigInfo.parameters.push(new vscode.ParameterInformation(label));
    }

    help.signatures = [sigInfo];
    help.activeSignature = 0;
    help.activeParameter = Math.min(activeParam, funcInfo.params.length - 1);
    return help;
  }

  private buildBuiltinSignatureHelp(func: { name: string; signature: string; doc: string }, activeParam: number): vscode.SignatureHelp {
    const help = new vscode.SignatureHelp();
    const sigInfo = new vscode.SignatureInformation(func.signature, func.doc);

    // Parse parameters from signature
    const paramMatch = func.signature.match(/\(([^)]*)\)/);
    if (paramMatch) {
      const params = paramMatch[1].split(',').map(p => p.trim()).filter(p => p);
      for (const p of params) {
        sigInfo.parameters.push(new vscode.ParameterInformation(p));
      }
      help.activeParameter = Math.min(activeParam, params.length - 1);
    }

    help.signatures = [sigInfo];
    help.activeSignature = 0;
    return help;
  }
}


// ─── HoverProvider ───

class Informix4GLHoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): vscode.Hover | undefined {
    const wordRange = document.getWordRangeAtPosition(position, /\w+/);
    if (!wordRange) { return undefined; }
    const word = document.getText(wordRange);

    // Check workspace functions
    const wsFunc = workspaceFunctions.get(word.toLowerCase());
    if (wsFunc) {
      const sig = buildSignatureLabel(wsFunc);
      const md = new vscode.MarkdownString();
      md.appendCodeblock(sig, '4gl');
      md.appendMarkdown(`\n\n*${wsFunc.detail}* defined in \`${path.basename(wsFunc.file)}:${wsFunc.line + 1}\``);
      return new vscode.Hover(md, wordRange);
    }

    // Check built-in functions
    const builtin = BUILTIN_FUNCTIONS.find(f => f.name.toLowerCase() === word.toLowerCase());
    if (builtin) {
      const md = new vscode.MarkdownString();
      md.appendCodeblock(builtin.signature, '4gl');
      md.appendMarkdown(`\n\n${builtin.doc}`);
      return new vscode.Hover(md, wordRange);
    }

    // Check built-in variables
    const upperWord = word.toUpperCase();
    if (BUILTIN_VARIABLES.includes(upperWord)) {
      const varDocs: Record<string, string> = {
        "STATUS": "Contains the status code of the last 4GL statement. Negative values indicate errors.",
        "SQLCA": "SQL Communication Area record containing error/status information.",
        "SQLCODE": "Equivalent to STATUS for SQL statements.",
        "SQLERRD": "Array of 6 integers with additional SQL error information. SQLERRD[2] = SERIAL value after INSERT.",
        "SQLAWARN": "Array of 8 characters with SQL warning flags.",
        "INT_FLAG": "Set to TRUE when the user presses the Interrupt key.",
        "QUIT_FLAG": "Set to TRUE when the user presses the Quit key.",
        "TODAY": "Returns the current system date as a DATE value.",
        "TIME": "Returns the current system time as a CHAR(8) value (HH:MM:SS).",
        "CURRENT": "Returns the current date and time as a DATETIME value.",
        "PAGENO": "Current page number in a report.",
        "LINENO": "Current line number in a report.",
        "NOTFOUND": "Constant equal to 100. Used to check if a FETCH/SELECT found no rows.",
        "TRUE": "Boolean constant TRUE.",
        "FALSE": "Boolean constant FALSE.",
        "NULL": "Represents the absence of a value.",
      };
      const doc = varDocs[upperWord] || `Built-in variable: ${upperWord}`;
      const md = new vscode.MarkdownString();
      md.appendCodeblock(upperWord, '4gl');
      md.appendMarkdown(`\n\n${doc}`);
      return new vscode.Hover(md, wordRange);
    }

    return undefined;
  }
}


// ─── DefinitionProvider ───

class Informix4GLDefinitionProvider implements vscode.DefinitionProvider {
  provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): vscode.Definition | undefined {
    const wordRange = document.getWordRangeAtPosition(position, /\w+/);
    if (!wordRange) { return undefined; }
    const word = document.getText(wordRange);

    const funcInfo = workspaceFunctions.get(word.toLowerCase());
    if (funcInfo) {
      return new vscode.Location(
        vscode.Uri.file(funcInfo.file),
        new vscode.Position(funcInfo.line, 0)
      );
    }

    return undefined;
  }
}


// ─── Document Symbol Provider (improved) ───

class Informix4GLDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
  public provideDocumentSymbols(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): vscode.DocumentSymbol[] {
    const symbols: vscode.DocumentSymbol[] = [];
    const funcRegex = /^\s*(function|report)\s+(\w+)\s*\(([^)]*)\)/i;
    const mainRegex = /^\s*main\s*$/i;
    const globalsRegex = /^\s*globals\s*$/i;
    const endFuncRegex = /^\s*end\s+(function|report)\s*$/i;
    const endMainRegex = /^\s*end\s+main\s*$/i;
    const endGlobalsRegex = /^\s*end\s+globals\s*$/i;

    interface PendingSymbol {
      symbol: vscode.DocumentSymbol;
      endRegex: RegExp;
    }

    const stack: PendingSymbol[] = [];

    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i);
      const text = line.text;

      const funcMatch = text.match(funcRegex);
      if (funcMatch) {
        const kind = funcMatch[1].toUpperCase() === 'REPORT' ? vscode.SymbolKind.Event : vscode.SymbolKind.Function;
        const name = funcMatch[2];
        const params = funcMatch[3].trim();
        const detail = params ? `(${params})` : '()';
        const sym = new vscode.DocumentSymbol(
          name, detail, kind, line.range, line.range
        );
        stack.push({ symbol: sym, endRegex: endFuncRegex });
        continue;
      }

      if (mainRegex.test(text)) {
        const sym = new vscode.DocumentSymbol(
          'MAIN', '', vscode.SymbolKind.Function, line.range, line.range
        );
        stack.push({ symbol: sym, endRegex: endMainRegex });
        continue;
      }

      if (globalsRegex.test(text)) {
        const sym = new vscode.DocumentSymbol(
          'GLOBALS', '', vscode.SymbolKind.Namespace, line.range, line.range
        );
        stack.push({ symbol: sym, endRegex: endGlobalsRegex });
        continue;
      }

      // Check for end markers
      if (stack.length > 0) {
        const pending = stack[stack.length - 1];
        if (pending.endRegex.test(text)) {
          const startLine = pending.symbol.range.start.line;
          const fullRange = new vscode.Range(
            new vscode.Position(startLine, 0),
            new vscode.Position(i, line.text.length)
          );
          pending.symbol = new vscode.DocumentSymbol(
            pending.symbol.name,
            pending.symbol.detail,
            pending.symbol.kind,
            fullRange,
            pending.symbol.selectionRange
          );
          const completed = stack.pop()!;
          symbols.push(completed.symbol);
          continue;
        }
      }
    }

    // Push any unclosed symbols
    for (const pending of stack) {
      symbols.push(pending.symbol);
    }

    return symbols;
  }
}


// ─── File Watcher: keep index updated ───

function setupFileWatcher(context: vscode.ExtensionContext): void {
  const watcher = vscode.workspace.createFileSystemWatcher('**/*.4gl');

  watcher.onDidChange(async (uri) => { await indexFile(uri); });
  watcher.onDidCreate(async (uri) => { await indexFile(uri); });
  watcher.onDidDelete((uri) => {
    // Remove functions from deleted file
    for (const [key, info] of workspaceFunctions) {
      if (info.file === uri.fsPath) {
        workspaceFunctions.delete(key);
      }
    }
  });

  // Also re-index when a document is saved
  vscode.workspace.onDidSaveTextDocument(async (doc) => {
    if (doc.languageId === '4gl' || doc.fileName.endsWith('.4gl')) {
      await indexFile(doc.uri);
    }
  });

  context.subscriptions.push(watcher);
}


// ─── Activation ───

export function activate(context: vscode.ExtensionContext) {
  const langSelector: vscode.DocumentSelector = { scheme: 'file', language: '4gl' };

  // Index workspace on activation
  indexWorkspaceFunctions();

  // Document Symbol Provider (Outline)
  context.subscriptions.push(
    vscode.languages.registerDocumentSymbolProvider(langSelector, new Informix4GLDocumentSymbolProvider())
  );

  // Completion Provider (IntelliSense)
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      langSelector,
      new Informix4GLCompletionProvider(),
      '.', '('
    )
  );

  // Signature Help Provider (parameter hints)
  context.subscriptions.push(
    vscode.languages.registerSignatureHelpProvider(
      langSelector,
      new Informix4GLSignatureHelpProvider(),
      { triggerCharacters: ['(', ','], retriggerCharacters: [','] }
    )
  );

  // Hover Provider
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(langSelector, new Informix4GLHoverProvider())
  );

  // Definition Provider (F12 / Go to Definition)
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(langSelector, new Informix4GLDefinitionProvider())
  );

  // File watcher for live index updates
  setupFileWatcher(context);
}
