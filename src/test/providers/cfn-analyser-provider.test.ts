import * as assert from 'assert';
import * as vscode from 'vscode';
import { AnalysisProvider, AnalysisItem } from '../../providers/cfn-analyser-provider';
import * as path from 'path';

suite('GIVEN an AnalysisProvider', () => {
    let provider: AnalysisProvider;
    const fixturesPath = path.join(__dirname, '..', 'fixtures');

    setup(() => {
        provider = new AnalysisProvider();
    });

    suite('WHEN a basic CloudFormation file is set', () => {
        test('THEN it should parse the file and create a tree', async () => {
            const testFilePath = path.join(fixturesPath, 'basic-cloudformation.yaml');
            await provider.setFile(testFilePath);

            const rootItems = await provider.getChildren();
            assert.strictEqual(rootItems.length, 1);
            assert.strictEqual(rootItems[0].label, 'Resources');

            const resourceItems = await provider.getChildren(rootItems[0]);
            assert.strictEqual(resourceItems.length, 1);
            assert.strictEqual(resourceItems[0].label, 'Other Resources');

            const resources = await provider.getChildren(resourceItems[0]);
            assert.strictEqual(resources.length, 2);
            assert.strictEqual(resources[0].label, 'MyBucket (AWS::S3::Bucket : 3)');
            assert.strictEqual(resources[1].label, 'MyQueue (AWS::SQS::Queue : 7)');
        });
    });

    suite('WHEN the CloudFormation file contains regions', () => {
        test('THEN it should group resources by region', async () => {
            const testFilePath = path.join(fixturesPath, 'cloudformation-with-regions.yaml');
            await provider.setFile(testFilePath);

            const rootItems = await provider.getChildren();
            assert.strictEqual(rootItems.length, 1);
            assert.strictEqual(rootItems[0].label, 'Resources');

            const regionItems = await provider.getChildren(rootItems[0]);
            assert.strictEqual(regionItems.length, 3); // us-east-1, eu-west-1, and Other Resources
            assert.strictEqual(regionItems[0].label, 'us-east-1');
            assert.strictEqual(regionItems[1].label, 'eu-west-1');
            assert.strictEqual(regionItems[2].label, 'Other Resources');

            const usEastResources = await provider.getChildren(regionItems[0]);
            assert.strictEqual(usEastResources.length, 1);
            assert.strictEqual(usEastResources[0].label, 'MyBucketUSEast (AWS::S3::Bucket : 5)');

            const euWestResources = await provider.getChildren(regionItems[1]);
            assert.strictEqual(euWestResources.length, 2);
            assert.strictEqual(euWestResources[0].label, 'MyBucketEUWest (AWS::S3::Bucket : 12)');
            assert.strictEqual(euWestResources[1].label, 'MyQueueEUWest (AWS::SQS::Queue : 16)');

            const globalResources = await provider.getChildren(regionItems[2]);
            assert.strictEqual(globalResources.length, 1);
            assert.strictEqual(globalResources[0].label, 'MyGlobalTable (AWS::DynamoDB::GlobalTable : 22)');
        });
    });

    suite('WHEN the CloudFormation file is empty', () => {
        test('THEN it should return a "No Resources Found" item', async () => {
            const testFilePath = path.join(fixturesPath, 'empty-cloudformation.yaml');
            await provider.setFile(testFilePath);

            const rootItems = await provider.getChildren();
            assert.strictEqual(rootItems.length, 1);
            assert.strictEqual(rootItems[0].label, 'No Resources Found');
        });
    });

    suite('WHEN getTreeItem is called', () => {
        test('THEN it should return the correct TreeItem', () => {
            const leafItem = new AnalysisItem('Leaf', 1, 'test.yaml');
            const parentItem = new AnalysisItem('Parent', 1, 'test.yaml', [leafItem]);

            const leafTreeItem = provider.getTreeItem(leafItem);
            assert.strictEqual(leafTreeItem.collapsibleState, vscode.TreeItemCollapsibleState.None);

            const parentTreeItem = provider.getTreeItem(parentItem);
            assert.strictEqual(parentTreeItem.collapsibleState, vscode.TreeItemCollapsibleState.Expanded);
        });
    });
});