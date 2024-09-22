import * as vscode from 'vscode';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { CLOUDFORMATION_SCHEMA } from 'js-yaml-cloudformation-schema';

type CloudFormationYaml = Record<string, unknown>;

export class AnalysisProvider implements vscode.TreeDataProvider<AnalysisItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<AnalysisItem | undefined | void> = new vscode.EventEmitter<AnalysisItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<AnalysisItem | undefined | void> = this._onDidChangeTreeData.event;

    private tree: AnalysisItem | undefined;

    constructor() { }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    setFile(filePath: string): void {
        fs.promises.readFile(filePath, 'utf8').then((content) => {
            const data = yaml.load(content, { schema: CLOUDFORMATION_SCHEMA });
            if (data) {
                const yaml = data as CloudFormationYaml;
                this.tree = createTreeFromCloudFormation(filePath, content, yaml);
                this.refresh();
            }
        });
    }

    getTreeItem(element: AnalysisItem): vscode.TreeItem {
        if(element.children.length == 0) {
            return new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.None);
        }
        
        return new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.Expanded);
    }

    getChildren(element?: AnalysisItem): Thenable<AnalysisItem[]> {
        if (element === undefined) {
            return Promise.resolve(this.tree ? [this.tree] : []);
        } else {
            return Promise.resolve(element.children);
        }
    }
}

class AnalysisItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly line: number,
        public readonly filePath: string,
        public readonly children: AnalysisItem[] = [],
        public readonly contextValue?: string
    ) {
        super(label, children.length > 0 ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None);
        this.tooltip = `${this.label} (Line: ${this.line})`;
    }
}

interface Region {
    name: string;
    startLine: number;
    endLine: number;
    resources: { name: string; type: string; line: number }[];
}

function createTreeFromCloudFormation(path: string, raw: string, yaml: CloudFormationYaml): AnalysisItem {
    if (!yaml.Resources) {
        return new AnalysisItem('No Resources Found', 0, '');
    }

    const rootNode = new AnalysisItem('Resources', 0, '');
    const regions = parseRegions(raw);
    const resources = Object.entries(yaml.Resources).map(([name, details]) => ({
        name,
        type: (details as any).Type,
        line: findNewLinesUpToToken(raw, name, (details as any).Type)
    }));

    // Group resources by region
    regions.forEach(region => {
        const regionNode = new AnalysisItem(region.name, region.startLine, path, [], 'region');
        region.resources = resources.filter(r => r.line >= region.startLine && r.line <= region.endLine);
        region.resources.forEach(resource => {
            const resourceLabel = `${resource.name} (${resource.type} : ${resource.line})`;
            regionNode.children.push(new AnalysisItem(resourceLabel, resource.line, path, [], 'resource'));
        });
        rootNode.children.push(regionNode);
    });

    // Add resources not in any region
    const unregionedResources = resources.filter(r => !regions.some(reg => r.line >= reg.startLine && r.line <= reg.endLine));
    if (unregionedResources.length > 0) {
        const unregionedNode = new AnalysisItem('Other Resources', 0, path, [], 'region');
        unregionedResources.forEach(resource => {
            const resourceLabel = `${resource.name} (${resource.type} : ${resource.line})`;
            unregionedNode.children.push(new AnalysisItem(resourceLabel, resource.line, path, [], 'resource'));
        });
        rootNode.children.push(unregionedNode);
    }

    return rootNode;
}

function parseRegions(content: string): Region[] {
    const lines = content.split('\n');
    const regions: Region[] = [];
    let currentRegion: Region | null = null;

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('### region:')) {
            if (currentRegion) {
                currentRegion.endLine = index - 1;
                regions.push(currentRegion);
            }
            currentRegion = {
                name: trimmedLine.substring('### region:'.length).replace(/#/g, '').trim(),
                startLine: index + 1,
                endLine: lines.length - 1,
                resources: []
            };
        } else if (trimmedLine === '### endregion' && currentRegion) {
            currentRegion.endLine = index - 1;
            regions.push(currentRegion);
            currentRegion = null;
        }
    });

    if (currentRegion) {
        regions.push(currentRegion);
    }

    return regions;
}


function findNewLinesUpToToken(input: string, samName: string, type: string): number {
    const lines = input.split('\n');

    // Iterate over each line to find the correct resource by name
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check if the current line contains the resource name (samName)
        if (line.includes(samName)) {
            // Look at the next line (if exists) to confirm it contains the type
            const nextLine = lines[i + 1] ? lines[i + 1].trim() : '';
            if (nextLine.includes(type)) {
                return i; // Return the line number where the type is found
            }
        }
    }

    // If the resource with matching name and type is not found, return 0
    return 0;
}
