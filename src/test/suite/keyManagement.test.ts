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

import { KeyGenerationService } from "../../services/keyManagement/keyGeneration";
import { KeyManagerController } from "../../services/keyManagement/keyManagerController";
import { PrivateKeyType, VSCodeInteractionService } from "../../services/keyManagement/vscodeInteraction";
import * as assert from "assert";
import * as vscode from "vscode";
import * as sinon from "sinon";
import * as fs from "fs";
import * as path from "path";
import * as helpers from '../../services/global/helpers';


suite("Key management suite", async () => {

    let sandbox: sinon.SinonSandbox;
    let extensionContext: vscode.ExtensionContext;
    let keyGenService: KeyGenerationService;
    let keyManagerController: KeyManagerController;
    let keyManagerInteractionService: VSCodeInteractionService;
    let tempDir: string;
    let tempUri: vscode.Uri;
    const fakeKeyFilename = "encrypted_key.pem";
    const fakePassword = "test-password";
    const expectedHeader = "-----BEGIN ENCRYPTED PRIVATE KEY-----";;
    const expectedEnding = "-----END ENCRYPTED PRIVATE KEY-----";


    setup(async () => {
        sandbox = sinon.createSandbox();
        await vscode.extensions.getExtension('Google.iwa-studio')?.activate();
        extensionContext = (global as any).ExtensionContext;
        keyGenService = new KeyGenerationService();
        keyManagerController = new KeyManagerController(extensionContext);
        keyManagerInteractionService = new VSCodeInteractionService();
        tempDir = path.join(process.cwd(), "iwa-studio-tests-temp");
        tempUri = vscode.Uri.file(tempDir);
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }
    });

    teardown(async () => {
        sandbox.restore();
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    //KeyGeneration.ts
    test("createPrivateKey of type ed25519 should return a valid key string", async () => {
        const encryptedKey = await keyGenService.createPrivateKey(fakePassword, PrivateKeyType.ED25519);
        const trimmedKey = encryptedKey.trim();

        assert.ok(
            trimmedKey.startsWith(expectedHeader),
            `Expected key to start with "${expectedHeader}"`
        );

        assert.ok(
            trimmedKey.endsWith(expectedEnding),
            `Expected key to end with "${expectedEnding}"`
        );


    });

    test("createPrivateKey of type p-256 should return a valid key string", async () => {
        const encryptedKey = await keyGenService.createPrivateKey(fakePassword, PrivateKeyType.P256);

        const trimmedKey = encryptedKey.trim();

        assert.ok(
            trimmedKey.startsWith(expectedHeader),
            `Expected key to start with "${expectedHeader}"`
        );

        assert.ok(
            trimmedKey.endsWith(expectedEnding),
            `Expected key to end with "${expectedEnding}"`
        );
    });

    //vscodeInteraction.ts
    test("promptForKeyFilename should return undefined if user cancels input", async () => {
        const inputBoxStub = sandbox.stub(vscode.window, 'showInputBox').resolves(undefined);
        const keyFilename = await keyManagerInteractionService.promptForKeyFilename(tempUri);

        assert.strictEqual(keyFilename, undefined, "keyFilename should be undefined");
    });

    test("promptForKeyFilename should call askToOverwrite() when this filename is alerady present.", async () => {
        const inputBoxStub = sandbox.stub(vscode.window, 'showInputBox').resolves(fakeKeyFilename);
        const fileExistsStub = sandbox.stub(keyManagerInteractionService, 'fileExists').resolves(true);
        const askToOverwriteStub = sandbox.stub(keyManagerInteractionService, 'askToOverwrite').resolves(true);

        const keyFilename = await keyManagerInteractionService.promptForKeyFilename(tempUri);

        sinon.assert.calledOnce(askToOverwriteStub);
        assert.strictEqual(keyFilename, fakeKeyFilename);
    });

    test("promptForKeyFilename should re-prompt if user declines overwrite", async () => {
        const newKeyFilename = "new_key.pem";
        const inputBoxStub = sandbox.stub(vscode.window, 'showInputBox');
        inputBoxStub.onFirstCall().resolves(fakeKeyFilename);
        inputBoxStub.onSecondCall().resolves(newKeyFilename);

        const fileExistsStub = sandbox.stub(keyManagerInteractionService, 'fileExists');
        fileExistsStub.withArgs(path.join(tempUri.fsPath, fakeKeyFilename)).returns(true);
        fileExistsStub.withArgs(path.join(tempUri.fsPath, newKeyFilename)).returns(false);

        const askToOverwriteStub = sandbox.stub(keyManagerInteractionService, 'askToOverwrite').resolves(false);

        const keyFilename = await keyManagerInteractionService.promptForKeyFilename(tempUri);

        sinon.assert.calledOnce(askToOverwriteStub);
        sinon.assert.calledTwice(inputBoxStub);
        assert.strictEqual(keyFilename, newKeyFilename);
    });

    test("promptForPassphrase should return undefined when canceled", async () => {
        const inputBoxStub = sandbox.stub(vscode.window, 'showInputBox').resolves(undefined);
        const passphrase = await keyManagerInteractionService.promptForPassphrase();

        assert.strictEqual(passphrase, undefined, "Password should be undefined");
    });

    test("promptForPassphrase should return a password", async () => {
        const inputBoxStub = sandbox.stub(vscode.window, 'showInputBox').resolves(fakePassword);
        const password = await keyManagerInteractionService.promptForPassphrase();

        assert.strictEqual(password, fakePassword, "Password should be resolved successfully");
    });

    test("promptForPassphrase should return an empty password successfully", async() =>{
        const inputBoxStub = sandbox.stub(vscode.window ,'showInputBox').resolves('');
        const quickPickStub = sandbox.stub(vscode.window, 'showQuickPick').resolves("Yes, create key with no password" as any);

        const password = await keyManagerInteractionService.promptForPassphrase();

        assert.strictEqual(password, '', "Password should be empty");

    });

    test("resolveSigningKey should call generateAndEncryptPrivateKey in case of generate choice", async () => {
        sandbox.stub(vscode.window, 'showQuickPick').resolves('Generate private key' as any);
        const generateAndEncryptPrivateKeyStub = sandbox.stub(keyManagerController, 'generateAndEncryptPrivateKey');

        await keyManagerController.resolveSigningKey();

        sinon.assert.calledOnce(generateAndEncryptPrivateKeyStub);
    });

    test("resolveSigningKey should call openKeyIntegrationTemplate in case of template choice", async () => {
        sandbox.stub(vscode.window, 'showQuickPick').resolves('Open key integration template' as any);
        const openIntegrationTemplateStub = sandbox.stub(keyManagerController, 'openKeyIntegrationTemplate');

        await keyManagerController.resolveSigningKey();

        sinon.assert.calledOnce(openIntegrationTemplateStub);

    });

    test("openKeyIntegrationTemplate should open a text document with some content", async () => {
        const readFileStub = sandbox.stub(fs.promises, 'readFile');
        const openTextDocumentStub = sandbox.stub(vscode.workspace, 'openTextDocument');
        const showTextDocumentStub = sandbox.stub(vscode.window, 'showTextDocument');

        await keyManagerController.openKeyIntegrationTemplate();

        sinon.assert.calledOnce(readFileStub);
        sinon.assert.calledOnce(openTextDocumentStub);
        sinon.assert.calledOnce(showTextDocumentStub);
    });

    test("addPemToGitIgnore happy path - creates .gitignore and adds entry", async () => {
        const workspaceUri = vscode.Uri.file(tempDir);
        sandbox.stub(helpers, 'checkWorkspaceOpened').returns(workspaceUri);

        //Using ES6 imports here doesn't work, so we have to use require https://github.com/sinonjs/sinon/issues/2377
        const execSyncStub = sandbox.stub(require('child_process'), "execSync").throws({ code: 1 });

        const quickPickStub = sandbox.stub(vscode.window, 'showQuickPick').resolves("Yes" as any);

        await keyManagerController.addPemToGitIgnore();

        sinon.assert.calledOnce(execSyncStub);
        sinon.assert.calledOnce(quickPickStub);

        const gitignorePath = path.join(tempDir, ".gitignore");
        const gitignoreContent = await fs.promises.readFile(gitignorePath, 'utf-8');
        const expectedContent = "\n\n# Ignore PEM certificate files\n*.pem\n";
        assert.strictEqual(gitignoreContent, expectedContent, ".gitignore content should match expected content");
    });

    test("addPemToGitIgnore should not prompt if .pem is already ignored", async () => {
        const workspaceUri = vscode.Uri.file(tempDir);
        sandbox.stub(helpers, 'checkWorkspaceOpened').returns(workspaceUri);

        // Stub execSync to succeed, indicating that *.pem is already ignored.
        //Using ES6 imports here doesn't work, so we have to use require https://github.com/sinonjs/sinon/issues/2377
        const execSyncStub = sandbox.stub(require('child_process'), 'execSync').returns(Buffer.from('')); 

        const quickPickStub = sandbox.stub(vscode.window, 'showQuickPick');

        await keyManagerController.addPemToGitIgnore();

        sinon.assert.calledOnce(execSyncStub);
        sinon.assert.notCalled(quickPickStub);
    });

    test("generateAndEncryptPrivateKey should create and save an encrypted key", async() =>{

        const checkWorkspaceOpenedStub = sandbox.stub(helpers, 'checkWorkspaceOpened').returns(tempUri);
        const addPemToGitignoreStub = sandbox.stub(keyManagerController,'addPemToGitIgnore');

        const showQuickPickStub = sandbox.stub(vscode.window, 'showQuickPick').resolves(PrivateKeyType.ED25519 as any);
        const inputBoxStub = sandbox.stub(vscode.window, 'showInputBox').resolves(fakeKeyFilename);

        await keyManagerController.generateAndEncryptPrivateKey();

        const savedKeyPath = path.join(tempUri.fsPath, fakeKeyFilename);
        const fileExists = fs.existsSync(savedKeyPath);

        const fileContent = await fs.promises.readFile(savedKeyPath, 'utf-8');
        const fileContentTrim = fileContent.trim();


        assert.ok(
            fileContentTrim.startsWith(expectedHeader),
            `Encrypted key should start with ${expectedHeader}`
        );

        assert.ok(
            fileContentTrim.endsWith(expectedEnding),
            `Encrypted key should end with ${expectedEnding}`
        );

        assert.strictEqual(fileExists, true, "Private key file was not saved");
    });
});