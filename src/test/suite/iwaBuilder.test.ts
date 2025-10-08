/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as stream from "stream";
import * as assert from "assert";
import * as vscode from "vscode";
import * as sinon from "sinon";
import * as fs from "fs/promises";
import * as fsSync from "fs";
import * as path from "path";
import * as iwaBuilder from "../../services/build/iwaBuilder";
import * as helpers from "../../services/global/helpers";
import * as os from 'os';


suite("IWA Builder Suite", () => {
    let sandbox: sinon.SinonSandbox;
    let tempDir: string;
    
    setup(() => {
        const tempDirPrefix = 'iwaBuilder-test';
        sandbox = sinon.createSandbox();
        tempDir = path.join(os.tmpdir(), "iwa-studio-tests-temp", tempDirPrefix);
        if (fsSync.existsSync(tempDir)) {
            fsSync.rmSync(tempDir, { recursive: true, force: true });
        }
        fsSync.mkdirSync(tempDir, { recursive: true });
    });

    teardown(async () => {
        sandbox.restore();
        if (fsSync.existsSync(tempDir)) {
            await fs.rm(tempDir, { recursive: true, force: true });
        }
    });

    test("getProjectDetails should return an array of 2 elements", async () => {
        const inputStub = sandbox.stub(vscode.window, "showInputBox").resolves("test-project");

        const projectDetails = await iwaBuilder.getProjectDetails();

        sinon.assert.calledTwice(inputStub);

        assert.ok(projectDetails, "projectDetails should be defined");
        assert.strictEqual(projectDetails.length, 2);
    });

    test("getProjectDetails should return undefined when user cancels input", async () => {
        const inputStub = sandbox.stub(vscode.window, "showInputBox").resolves(undefined);
        const projectDetails = await iwaBuilder.getProjectDetails();

        assert.strictEqual(projectDetails, undefined);
    });

    test("createProjectPath should create a directory", async () => {
        const testIdentifier = "test-project";
        const testUri = vscode.Uri.file(tempDir);
        const projectPath = path.join(tempDir, testIdentifier);

        sandbox.stub(vscode.window, "showOpenDialog").resolves([testUri]);

        const createdPath = await iwaBuilder.createProjectPath(testIdentifier);

        assert.strictEqual(createdPath, projectPath, "Should return the created path");

        const exists = await fsSync.existsSync(createdPath);

        assert.strictEqual(exists, true, "Directory should be created");
    });

    test("createProjectPath should fail if user cancels directory creation prompt", async () => {
        sandbox.stub(vscode.window, "showOpenDialog").resolves(undefined);
        const testIdentifier = "test-project";
        const errorMessageStub = sandbox.stub(vscode.window, "showErrorMessage");

        const createdPath = await iwaBuilder.createProjectPath(testIdentifier);

        sinon.assert.calledOnce(errorMessageStub);
        assert.equal(
            createdPath,
            undefined,
            "createdPath should returned undefined on user cancel",
        );
    });

    test("selectBundler should return the selected bundler", async () => {
        const bundler = "Vite";
        sandbox.stub(vscode.window, "showQuickPick").resolves(bundler as any);
        const result = await iwaBuilder.selectBundler();
        assert.strictEqual(result, bundler);
    });

    test("selectBundler should return undefined if user cancels", async () => {
        sandbox.stub(vscode.window, "showQuickPick").resolves(undefined);
        const errorMessageStub = sandbox.stub(vscode.window, "showErrorMessage");
        const result = await iwaBuilder.selectBundler();
        assert.strictEqual(result, undefined);
        sinon.assert.calledOnce(errorMessageStub);
    });

    test("fetchArchive should call fetch with the correct template url", async () => {
        const bundlerChoice = 'Vite';
        const templateUrl = iwaBuilder.config.bundlers.Vite.url;
        const mockBody = new stream.Readable();
        mockBody.push(null); // Signals the end of the stream
        const mockResponse = {
            ok: true,
            arrayBuffer: async () => new ArrayBuffer(0),
            body: mockBody,
        };
        const fetchStub = sandbox.stub(global, "fetch").resolves(mockResponse as any);

        await iwaBuilder.fetchArchive(bundlerChoice, tempDir);

        sinon.assert.calledOnceWithExactly(fetchStub, templateUrl);
    });

    test("generateEnv should create a .env file with correct content", async () => {
        await iwaBuilder.generateEnv(tempDir);
        const envPath = path.join(tempDir, ".env");
        const fileExists = fsSync.existsSync(envPath);
        assert.ok(fileExists, ".env file should be created");

        const fileContent = await fs.readFile(envPath, "utf-8");
        assert.strictEqual(fileContent, iwaBuilder.config.envData);
    });

    test("editManifestProperties should update name and short_name", async () => {
        const packageJsonPath = path.join(tempDir, "package.json");
        const webManifestDirPath = path.join(tempDir, "public", ".well-known");
        fsSync.mkdirSync(webManifestDirPath, { recursive: true });
        const webManifestPath = path.join(webManifestDirPath, "manifest.webmanifest");

        const initialPackageJson = { name: "old-name", short_name: "old-id" };
        const initialWebManifest = { name: "old-name", short_name: "old-id" };

        await fs.writeFile(packageJsonPath, JSON.stringify(initialPackageJson));
        await fs.writeFile(webManifestPath, JSON.stringify(initialWebManifest));

        const newName = "new-project-name";
        const newIdentifier = "new-project-id";

        await iwaBuilder.editManifestProperties(tempDir, newName, newIdentifier);

        const updatedPackageJsonContent = await fs.readFile(packageJsonPath, "utf-8");
        const updatedPackageJson = JSON.parse(updatedPackageJsonContent);
        assert.strictEqual(updatedPackageJson.name, newName);
        assert.strictEqual(updatedPackageJson.short_name, newIdentifier);

        const updatedWebManifestContent = await fs.readFile(webManifestPath, "utf-8");
        const updatedWebManifest = JSON.parse(updatedWebManifestContent);
        assert.strictEqual(updatedWebManifest.name, newName);
        assert.strictEqual(updatedWebManifest.short_name, newIdentifier);
    });

    test("offerWorkspaceChange should call changeWorkspace when user selects 'Yes'", async () => {
        const changeWorkspaceStub = sandbox.stub(helpers, "changeWorkspace");
        sandbox.stub(vscode.window, "showQuickPick").resolves("Yes" as any);

        await iwaBuilder.offerWorkspaceChange(tempDir);

        sinon.assert.calledOnceWithExactly(changeWorkspaceStub, tempDir);
    });

    test("installDependencies should resolve on successful installation", async () => {
        const mockTerminal = {
            show: sinon.stub(),
            sendText: sinon.stub(),
            dispose: sinon.stub(),
            exitStatus: { code: 0 },
        };
        sandbox.stub(vscode.window, "createTerminal").returns(mockTerminal as any);

        const onDidCloseTerminalStub = sandbox.stub(vscode.window, "onDidCloseTerminal");
        onDidCloseTerminalStub.callsFake((listener) => {
            listener(mockTerminal as any);
            return { dispose: () => {} };
        });

        await iwaBuilder.installDependencies(tempDir);

        sinon.assert.calledOnce(mockTerminal.show);
        sinon.assert.calledWith(mockTerminal.sendText, iwaBuilder.config.npmInstallCommand);
    });
});
