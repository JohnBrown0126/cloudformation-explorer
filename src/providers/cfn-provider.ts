import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as readLine from 'readline';

export class CloudFormationProvider implements vscode.TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | void> = new vscode.EventEmitter<TreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | void> = this._onDidChangeTreeData.event;

    constructor(private workspaceRoot: string | undefined) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: TreeItem): Promise<TreeItem[]> {
        if (!this.workspaceRoot) {
            return Promise.resolve([]);
        }

        const files = await vscode.workspace.findFiles('**/*.yaml');
        
        // Filter CloudFormation templates by checking the first line
        const cloudFormationFiles = [];
        for (const file of files) {
            const isTemplate = await checkAWSTemplateFormatVersion(file.fsPath);
            if (isTemplate) {
                const directory = path.dirname(file.fsPath).substring(this.workspaceRoot.length + 1); // strip leading slash
                cloudFormationFiles.push(new TreeItem(`${directory}/${path.basename(file.fsPath)}`, vscode.TreeItemCollapsibleState.None, file.fsPath));
            }
        }

        return cloudFormationFiles;
    }
}

// Function to check the first line for 'AWSTemplateFormatVersion'
function checkAWSTemplateFormatVersion(filePath: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const fileStream = fs.createReadStream(filePath);
        const rl = readLine.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        rl.once('line', (line) => {
            const trimmedLine = line.trim();

            const isValidFirstLine = trimmedLine.includes('AWSTemplateFormatVersion')
            
            rl.close();
            resolve(isValidFirstLine);
        });

        rl.on('close', () => {
            fileStream.close();
        });

        fileStream.on('error', (error) => {
            reject(error);
        });
    });
}


// TreeItem class for CloudFormation files
class TreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly filePath: string // To pass the file path to the analysis view
    ) {
        super(label, collapsibleState);
    }
}
