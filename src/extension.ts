// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ErrorProvider } from './providers/error-provider';
import { AnalysisProvider } from './providers/cfn-analyser-provider';
import { CloudFormationProvider } from './providers/cfn-provider';

export async function activate(context: vscode.ExtensionContext) {
    const workspaceDirectory = vscode.workspace.workspaceFolders;
    if (workspaceDirectory === undefined || workspaceDirectory.length === 0) {
        vscode.window.createTreeView('cloudformation-explorer', {
            treeDataProvider: new ErrorProvider('No workspace folders are open')
        });
        return;
    }

    const cloudFormationProvider = new CloudFormationProvider(workspaceDirectory[0].uri.path);
    const analysisProvider = new AnalysisProvider();

    const cloudFormationView = vscode.window.createTreeView('cloudformation-explorer', { treeDataProvider: cloudFormationProvider });
    const analysisView = vscode.window.createTreeView('cloudformation-analysis', { treeDataProvider: analysisProvider });

    // Event listener for when a file is selected in the CloudFormation view
    cloudFormationView.onDidChangeSelection((e) => {
        if (e.selection.length > 0) {
            const selectedFile = e.selection[0].filePath;
            analysisProvider.setFile(selectedFile); // Set the file for analysis
        }
    });

    analysisView.onDidChangeSelection((e) => {
        if (e.selection.length > 0) {
            gotoLine(e.selection[0].filePath, e.selection[0].line);
        }

    });

    // Register commands
    vscode.commands.registerCommand('cloudformation-explorer.refresh', () => cloudFormationProvider.refresh());
    vscode.commands.registerCommand('cloudformation-analysis.refresh', () => analysisProvider.refresh());
}

async function gotoLine(filePath: string, lineNumber: number) {
    console.log(`Opening file: ${filePath} at line: ${lineNumber}`);
    try {
        const document = await vscode.workspace.openTextDocument(filePath);
        const editor = await vscode.window.showTextDocument(document);
        const position = new vscode.Position(lineNumber, 0);
        const range = new vscode.Range(position, position);
        editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
        editor.selection = new vscode.Selection(position, position);
    } catch (err) {
        vscode.window.showErrorMessage(`Failed to open file: ${err}`);
    }
}


export function deactivate() { }