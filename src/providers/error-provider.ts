import * as vscode from 'vscode';

interface ErrorItem {
    label: string;
    state?: vscode.TreeItemCollapsibleState;
    iconPath?: string;
}

export class ErrorProvider implements vscode.TreeDataProvider<ErrorItem> {

    private message: string;

    constructor(message: string) {
        this.message = message;
    }

    getTreeItem(element: ErrorItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ErrorItem): Thenable<ErrorItem[]> {
        // Just return the error message as a single item
        return Promise.resolve([{
            label: this.message,
            state: vscode.TreeItemCollapsibleState.Expanded
        }]);
    }
}