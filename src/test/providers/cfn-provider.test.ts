import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';
import { CloudFormationProvider, TreeItem } from '../../providers/cfn-provider'; // Adjust the import path as needed

suite('CloudFormationProvider', () => {
    let provider: CloudFormationProvider;
    const workspaceDirectory = vscode.workspace.workspaceFolders;

    setup(() => {

        if (workspaceDirectory === undefined || workspaceDirectory.length === 0) {
            throw new Error('Test workspace not setup correctly');
        }
        provider = new CloudFormationProvider(workspaceDirectory[0].uri.path);
    });

    suite('File Discovery', () => {
        test('should find YAML files in workspace', async () => {
            const children = await provider.getChildren();
            assert.ok(children.length > 0, 'Should find at least one YAML file');
            children.forEach(child => {
                assert.ok(child.label.endsWith('.yaml'), 'Found file should be a YAML file');
            });
        });

        test('should skip non-YAML files in workspace', async () => {
            const nonYamlFiles = ['non-yaml-file.txt', 'some-image.png']; // Mocking non-YAML files
            const children = await provider.getChildren();
            nonYamlFiles.forEach(nonYamlFile => {
                assert.ok(!children.some(child => child.label.includes(nonYamlFile)), `Should skip non-YAML file: ${nonYamlFile}`);
            });
        });
    });

    suite('CloudFormation Parsing', () => {
        test('should correctly identify CloudFormation templates', async () => {
            const children = await provider.getChildren();
            assert.ok(children.length > 0, 'Should find at least one CloudFormation template');
            children.forEach(child => {
                assert.ok(child instanceof TreeItem, 'Found item should be a TreeItem');
            });
        });
    });
});
