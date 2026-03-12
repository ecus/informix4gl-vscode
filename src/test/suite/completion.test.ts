import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';

suite('Completion Provider - Source Information', () => {

  const testWorkspace = path.resolve(__dirname, '../../../test');

  // Helper: wait for extension to activate and index files
  async function waitForExtensionReady(): Promise<void> {
    // Open a .4gl file to trigger activation
    const sampleFile = vscode.Uri.file(path.join(testWorkspace, 'sample.4gl'));
    const doc = await vscode.workspace.openTextDocument(sampleFile);
    await vscode.window.showTextDocument(doc);
    // Give the extension time to index workspace functions
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // Helper: get completion items at a position in a document
  async function getCompletions(
    doc: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.CompletionItem[]> {
    const completionList = await vscode.commands.executeCommand<vscode.CompletionList>(
      'vscode.executeCompletionItemProvider',
      doc.uri,
      position
    );
    return completionList?.items ?? [];
  }

  // Helper: find a completion item by label
  function findCompletion(items: vscode.CompletionItem[], label: string): vscode.CompletionItem | undefined {
    return items.find(item => {
      const itemLabel = typeof item.label === 'string' ? item.label : (item.label as any).label;
      return itemLabel.toLowerCase() === label.toLowerCase();
    });
  }

  suiteSetup(async () => {
    await waitForExtensionReady();
  });

  // ── Workspace function detail shows filename ──

  test('Workspace function from sample.4gl shows "FUNCTION (sample.4gl)" in detail', async () => {
    const sampleFile = vscode.Uri.file(path.join(testWorkspace, 'sample.4gl'));
    const doc = await vscode.workspace.openTextDocument(sampleFile);
    await vscode.window.showTextDocument(doc);

    // Get completions at the beginning of a line in MAIN block
    const position = new vscode.Position(30, 5); // inside MAIN
    const items = await getCompletions(doc, position);

    const initProgram = findCompletion(items, 'init_program');
    assert.ok(initProgram, 'Should find init_program in completions');
    assert.ok(
      typeof initProgram.detail === 'string' && initProgram.detail.includes('sample.4gl'),
      `detail should include "sample.4gl", got: "${initProgram.detail}"`
    );
    assert.ok(
      typeof initProgram.detail === 'string' && initProgram.detail.includes('FUNCTION'),
      `detail should include "FUNCTION", got: "${initProgram.detail}"`
    );
  });

  test('Workspace function from utils.4gl shows "FUNCTION (utils.4gl)" in detail', async () => {
    const sampleFile = vscode.Uri.file(path.join(testWorkspace, 'sample.4gl'));
    const doc = await vscode.workspace.openTextDocument(sampleFile);
    await vscode.window.showTextDocument(doc);

    const position = new vscode.Position(30, 5);
    const items = await getCompletions(doc, position);

    const formatDate = findCompletion(items, 'format_date');
    assert.ok(formatDate, 'Should find format_date in completions');
    assert.ok(
      typeof formatDate.detail === 'string' && formatDate.detail.includes('utils.4gl'),
      `detail should include "utils.4gl", got: "${formatDate.detail}"`
    );
    assert.ok(
      typeof formatDate.detail === 'string' && formatDate.detail.includes('FUNCTION'),
      `detail should include "FUNCTION", got: "${formatDate.detail}"`
    );
  });

  test('All utils.4gl functions show source file in detail', async () => {
    const sampleFile = vscode.Uri.file(path.join(testWorkspace, 'sample.4gl'));
    const doc = await vscode.workspace.openTextDocument(sampleFile);
    await vscode.window.showTextDocument(doc);

    const position = new vscode.Position(30, 5);
    const items = await getCompletions(doc, position);

    const utilsFunctions = ['format_date', 'validate_email', 'get_sequence', 'show_message', 'log_activity'];
    for (const funcName of utilsFunctions) {
      const item = findCompletion(items, funcName);
      assert.ok(item, `Should find ${funcName} in completions`);
      assert.ok(
        typeof item.detail === 'string' && item.detail.includes('utils.4gl'),
        `${funcName} detail should include "utils.4gl", got: "${item.detail}"`
      );
    }
  });

  test('Report from sample.4gl shows "REPORT (sample.4gl)" in detail', async () => {
    const sampleFile = vscode.Uri.file(path.join(testWorkspace, 'sample.4gl'));
    const doc = await vscode.workspace.openTextDocument(sampleFile);
    await vscode.window.showTextDocument(doc);

    const position = new vscode.Position(30, 5);
    const items = await getCompletions(doc, position);

    const report = findCompletion(items, 'order_report');
    assert.ok(report, 'Should find order_report in completions');
    assert.ok(
      typeof report.detail === 'string' && report.detail.includes('REPORT'),
      `detail should include "REPORT", got: "${report.detail}"`
    );
    assert.ok(
      typeof report.detail === 'string' && report.detail.includes('sample.4gl'),
      `detail should include "sample.4gl", got: "${report.detail}"`
    );
  });

  // ── Built-in function detail ──

  test('Built-in functions show "Built-in function" in detail', async () => {
    const sampleFile = vscode.Uri.file(path.join(testWorkspace, 'sample.4gl'));
    const doc = await vscode.workspace.openTextDocument(sampleFile);
    await vscode.window.showTextDocument(doc);

    const position = new vscode.Position(30, 5);
    const items = await getCompletions(doc, position);

    const builtinNames = ['UPSHIFT', 'DOWNSHIFT', 'LENGTH', 'AVG', 'COUNT', 'DATE', 'TRIM', 'NVL'];
    for (const name of builtinNames) {
      const item = findCompletion(items, name);
      assert.ok(item, `Should find built-in function ${name} in completions`);
      assert.strictEqual(
        item.detail,
        'Built-in function',
        `${name} detail should be "Built-in function", got: "${item.detail}"`
      );
    }
  });

  // ── Keywords detail ──

  test('Keywords show "Keyword" in detail', async () => {
    const sampleFile = vscode.Uri.file(path.join(testWorkspace, 'sample.4gl'));
    const doc = await vscode.workspace.openTextDocument(sampleFile);
    await vscode.window.showTextDocument(doc);

    const position = new vscode.Position(30, 5);
    const items = await getCompletions(doc, position);

    const keywords = ['DEFINE', 'IF', 'THEN', 'WHILE', 'FOR', 'RETURN', 'CALL', 'DISPLAY'];
    for (const kw of keywords) {
      const item = findCompletion(items, kw);
      assert.ok(item, `Should find keyword ${kw} in completions`);
      assert.strictEqual(
        item.detail,
        'Keyword',
        `${kw} detail should be "Keyword", got: "${item.detail}"`
      );
    }
  });

  // ── Built-in variables detail ──

  test('Built-in variables show "Built-in variable" in detail', async () => {
    const sampleFile = vscode.Uri.file(path.join(testWorkspace, 'sample.4gl'));
    const doc = await vscode.workspace.openTextDocument(sampleFile);
    await vscode.window.showTextDocument(doc);

    const position = new vscode.Position(30, 5);
    const items = await getCompletions(doc, position);

    const vars = ['STATUS', 'SQLCA', 'TODAY', 'TRUE', 'FALSE', 'NULL'];
    for (const v of vars) {
      const item = findCompletion(items, v);
      assert.ok(item, `Should find built-in variable ${v} in completions`);
      assert.strictEqual(
        item.detail,
        'Built-in variable',
        `${v} detail should be "Built-in variable", got: "${item.detail}"`
      );
    }
  });

  // ── Detail format: FUNCTION vs REPORT distinction ──

  test('FUNCTION and REPORT have different detail prefixes', async () => {
    const sampleFile = vscode.Uri.file(path.join(testWorkspace, 'sample.4gl'));
    const doc = await vscode.workspace.openTextDocument(sampleFile);
    await vscode.window.showTextDocument(doc);

    const position = new vscode.Position(30, 5);
    const items = await getCompletions(doc, position);

    const func = findCompletion(items, 'init_program');
    const report = findCompletion(items, 'order_report');

    assert.ok(func, 'Should find init_program');
    assert.ok(report, 'Should find order_report');

    assert.ok(
      typeof func.detail === 'string' && func.detail.startsWith('FUNCTION'),
      `Function detail should start with "FUNCTION", got: "${func.detail}"`
    );
    assert.ok(
      typeof report.detail === 'string' && report.detail.startsWith('REPORT'),
      `Report detail should start with "REPORT", got: "${report.detail}"`
    );
  });

  // ── Documentation includes file and line info ──

  test('Workspace function documentation includes file location', async () => {
    const sampleFile = vscode.Uri.file(path.join(testWorkspace, 'sample.4gl'));
    const doc = await vscode.workspace.openTextDocument(sampleFile);
    await vscode.window.showTextDocument(doc);

    const position = new vscode.Position(30, 5);
    const items = await getCompletions(doc, position);

    const func = findCompletion(items, 'init_program');
    assert.ok(func, 'Should find init_program');

    const docString = func.documentation;
    assert.ok(docString, 'Should have documentation');

    let docText: string;
    if (typeof docString === 'string') {
      docText = docString;
    } else {
      docText = (docString as vscode.MarkdownString).value;
    }

    assert.ok(
      docText.includes('Defined in'),
      `Documentation should include "Defined in", got: "${docText}"`
    );
    assert.ok(
      docText.includes('sample.4gl'),
      `Documentation should include filename "sample.4gl", got: "${docText}"`
    );
  });

  test('Cross-file function documentation shows correct source file', async () => {
    const sampleFile = vscode.Uri.file(path.join(testWorkspace, 'sample.4gl'));
    const doc = await vscode.workspace.openTextDocument(sampleFile);
    await vscode.window.showTextDocument(doc);

    const position = new vscode.Position(30, 5);
    const items = await getCompletions(doc, position);

    const func = findCompletion(items, 'validate_email');
    assert.ok(func, 'Should find validate_email');

    const docString = func.documentation;
    assert.ok(docString, 'Should have documentation');

    let docText: string;
    if (typeof docString === 'string') {
      docText = docString;
    } else {
      docText = (docString as vscode.MarkdownString).value;
    }

    assert.ok(
      docText.includes('utils.4gl'),
      `Documentation should reference "utils.4gl", got: "${docText}"`
    );
  });

  // ── Completion item kinds ──

  test('Different completion types have correct CompletionItemKind', async () => {
    const sampleFile = vscode.Uri.file(path.join(testWorkspace, 'sample.4gl'));
    const doc = await vscode.workspace.openTextDocument(sampleFile);
    await vscode.window.showTextDocument(doc);

    const position = new vscode.Position(30, 5);
    const items = await getCompletions(doc, position);

    // Workspace function -> Function kind
    const wsFunc = findCompletion(items, 'init_program');
    assert.ok(wsFunc, 'Should find init_program');
    assert.strictEqual(wsFunc.kind, vscode.CompletionItemKind.Function, 'Workspace function should be Function kind');

    // Built-in function -> Function kind
    const builtinFunc = findCompletion(items, 'UPSHIFT');
    assert.ok(builtinFunc, 'Should find UPSHIFT');
    assert.strictEqual(builtinFunc.kind, vscode.CompletionItemKind.Function, 'Built-in function should be Function kind');

    // Keyword -> Keyword kind
    const keyword = findCompletion(items, 'DEFINE');
    assert.ok(keyword, 'Should find DEFINE');
    assert.strictEqual(keyword.kind, vscode.CompletionItemKind.Keyword, 'Keyword should be Keyword kind');

    // Built-in variable -> Variable kind
    const variable = findCompletion(items, 'STATUS');
    assert.ok(variable, 'Should find STATUS');
    assert.strictEqual(variable.kind, vscode.CompletionItemKind.Variable, 'Built-in variable should be Variable kind');
  });

  // ── Detail format: "TYPE (filename)" ──

  test('Workspace function detail format is "TYPE (filename.4gl)"', async () => {
    const sampleFile = vscode.Uri.file(path.join(testWorkspace, 'sample.4gl'));
    const doc = await vscode.workspace.openTextDocument(sampleFile);
    await vscode.window.showTextDocument(doc);

    const position = new vscode.Position(30, 5);
    const items = await getCompletions(doc, position);

    const func = findCompletion(items, 'process_data');
    assert.ok(func, 'Should find process_data');
    assert.strictEqual(
      func.detail,
      'FUNCTION (sample.4gl)',
      `Detail should be exactly "FUNCTION (sample.4gl)", got: "${func.detail}"`
    );

    const utilFunc = findCompletion(items, 'get_sequence');
    assert.ok(utilFunc, 'Should find get_sequence');
    assert.strictEqual(
      utilFunc.detail,
      'FUNCTION (utils.4gl)',
      `Detail should be exactly "FUNCTION (utils.4gl)", got: "${utilFunc.detail}"`
    );
  });

  // ── Signature in documentation ──

  test('Workspace function documentation includes signature with parameter types', async () => {
    const sampleFile = vscode.Uri.file(path.join(testWorkspace, 'sample.4gl'));
    const doc = await vscode.workspace.openTextDocument(sampleFile);
    await vscode.window.showTextDocument(doc);

    const position = new vscode.Position(30, 5);
    const items = await getCompletions(doc, position);

    const func = findCompletion(items, 'init_program');
    assert.ok(func, 'Should find init_program');

    let docText: string;
    const docString = func.documentation;
    if (typeof docString === 'string') {
      docText = docString;
    } else {
      docText = (docString as vscode.MarkdownString).value;
    }

    // Should contain the function signature with params
    assert.ok(
      docText.includes('init_program'),
      `Documentation should include function name in signature`
    );
    assert.ok(
      docText.includes('p_name'),
      `Documentation should include parameter "p_name" in signature`
    );
    assert.ok(
      docText.includes('p_value'),
      `Documentation should include parameter "p_value" in signature`
    );
  });
});
