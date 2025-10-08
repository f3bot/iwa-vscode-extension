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

import * as assert from "assert";
import * as vscode from "vscode";
import * as sinon from "sinon";
import { InstallerService } from "../../services/iwaInstaller/installerService";
import { InstallerVSCodeIntegration } from "../../services/iwaInstaller/installerVSCodeIntegration";
import { afterEach, beforeEach } from "mocha";
import { InstallerController } from "../../services/iwaInstaller/installerController";
import * as puppeteer from "puppeteer-core";

suite("Installer Test Suite", () => {
    let installerService: InstallerService;
    let installerVSCodeIntegration: InstallerVSCodeIntegration;
    let installerController: InstallerController;
    let context: vscode.ExtensionContext;
    let sandbox: sinon.SinonSandbox;

    suiteSetup(async () => {
        await vscode.extensions.getExtension("Google.iwa-studio")?.activate();
        context = (global as any).ExtensionContext;
        installerVSCodeIntegration = new InstallerVSCodeIntegration();
        installerService = new InstallerService(installerVSCodeIntegration);
        installerController = new InstallerController(context);
    });

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    test("generateBundleId should generate a random bundleId", () => {
        const bundleId = installerService.generateBundleId();
        assert.ok(
            bundleId.startsWith("isolated-app://"),
            "Bundle ID should start with isolated-app://",
        );
        assert.ok(
            bundleId.length > "isolated-app://".length,
            "Bundle ID should have a random part",
        );
    });

    test("getBundlePath should automatically select bundle when only 1 is available", async () => {
        const findFilesStub = sandbox
            .stub(vscode.workspace, "findFiles")
            .resolves([vscode.Uri.file("test.swbn")]);
        const result = await installerVSCodeIntegration.getBundlePath();
        assert.strictEqual(result, vscode.Uri.file("test.swbn").fsPath);
        assert.ok(findFilesStub.calledOnce);
    });

    test("getBundlePath should show list for multiple bundles", async () => {
        const findFilesStub = sandbox
            .stub(vscode.workspace, "findFiles")
            .resolves([vscode.Uri.file("test1.swbn"), vscode.Uri.file("test2.swbn")]);
        const showQuickPickStub = sandbox
            .stub(vscode.window, "showQuickPick")
            .resolves("test2.swbn" as any);
        const result = await installerVSCodeIntegration.getBundlePath();
        assert.strictEqual(result, "test2.swbn");
        assert.ok(findFilesStub.calledOnce);
        assert.ok(showQuickPickStub.calledOnce);
    });

    test("launchBrowser should call puppeteer.launch() with correct arguments", async () => {
        const stubBrowser = {
            target: sandbox.stub().returns({ createCDPSession: sandbox.stub() }),
        };
        const launchStub = sandbox.stub(puppeteer, "launch").resolves(stubBrowser as any);

        await installerService.launchBrowser();

        sinon.assert.calledOnce(launchStub);
        sinon.assert.calledWithExactly(launchStub, {
            headless: false,
            args: [
                "--window-size=800x800",
                "--enable-features=IsolatedWebApps,IsolatedWebAppDevMode",
            ],
            pipe: true,
            executablePath: puppeteer.executablePath("chrome"),
        });
    });

    test("connectToBrowser should call puppeteer.connect() with correct arguments", async () => {
        const stubBrowser = {
            target: sandbox.stub().returns({ createCDPSession: sandbox.stub() }),
        };
        const connectStub = sandbox.stub(puppeteer, "connect").resolves(stubBrowser as any);
        const testEndpoint = "http://test-endpoint";

        await installerService.connectToBrowser(testEndpoint);

        sinon.assert.calledOnce(connectStub);
        sinon.assert.calledWithExactly(connectStub, {
            browserURL: testEndpoint,
        });
    });

    test("getDevProxyConfig should return correct information for dev proxy installation", async () => {
        const localhost = "http://localhost:1234";
        const bundleId = "isolated-app://test-bundle-id";
        sandbox
            .stub(InstallerVSCodeIntegration.prototype, "askForLocalhostServer")
            .resolves(localhost);
        sandbox.stub(InstallerService.prototype, "generateBundleId").returns(bundleId);

        const config = await installerController.getDevProxyConfig();

        assert.deepStrictEqual(config, {
            installUrlOrBundleUrl: localhost,
            manifestID: bundleId,
        });
    });

    test("getDevProxyConfig should return undefined when localhost is not provided", async () => {
        sandbox
            .stub(InstallerVSCodeIntegration.prototype, "askForLocalhostServer")
            .resolves(undefined);
        const config = await installerController.getDevProxyConfig();
        assert.strictEqual(config, undefined);
    });

    test("getBundleConfig should return correct information for local .swbn installation", async () => {
        const bundlePath = "/path/to/bundle.swbn";
        const manifestId = "isolated-app://manifest-id";
        sandbox.stub(InstallerVSCodeIntegration.prototype, "getBundlePath").resolves(bundlePath);
        sandbox.stub(InstallerVSCodeIntegration.prototype, "getManifestId").resolves(manifestId);

        const config = await installerController.getBundleConfig(true);

        assert.deepStrictEqual(config, {
            installUrlOrBundleUrl: `file://${bundlePath}`,
            manifestID: manifestId,
        });
    });

    test("getBundleConfig should return correct information for remote .swbn installation", async () => {
        const bundlePath = "/path/to/bundle.swbn";
        const manifestId = "isolated-app://manifest-id";
        const httpServer = "http://localhost:8000/bundle.swbn";
        sandbox.stub(InstallerVSCodeIntegration.prototype, "getBundlePath").resolves(bundlePath);
        sandbox.stub(InstallerVSCodeIntegration.prototype, "getManifestId").resolves(manifestId);
        sandbox.stub(InstallerVSCodeIntegration.prototype, "getHttpServerUrl").resolves(httpServer);

        const config = await installerController.getBundleConfig(false);

        assert.deepStrictEqual(config, {
            installUrlOrBundleUrl: httpServer,
            manifestID: manifestId,
        });
    });

    test("installIwa should call functions in correct order for local install", async () => {
        const launchBrowserStub = sandbox
            .stub(InstallerService.prototype, "launchBrowser")
            .resolves();
        const connectToBrowserStub = sandbox.stub(InstallerService.prototype, "connectToBrowser");
        const sendCommandStub = sandbox.stub(InstallerService.prototype, "sendCommand").resolves();
        const installUrl = "file:///path/to/bundle.swbn";
        const manifestId = "isolated-app://manifest-id";

        await installerController.installIwa(installUrl, manifestId);

        sinon.assert.calledOnce(launchBrowserStub);
        sinon.assert.notCalled(connectToBrowserStub);
        sinon.assert.calledTwice(sendCommandStub);
        sinon.assert.calledWith(sendCommandStub.firstCall, "PWA.install", {
            manifestId: manifestId,
            installUrlOrBundleUrl: installUrl,
        });
        sinon.assert.calledWith(sendCommandStub.secondCall, "PWA.launch", {
            manifestId: manifestId,
        });
    });

    test("installIwa should call functions in correct order for remote install", async () => {
        const launchBrowserStub = sandbox.stub(InstallerService.prototype, "launchBrowser");
        const connectToBrowserStub = sandbox
            .stub(InstallerService.prototype, "connectToBrowser")
            .resolves();
        const sendCommandStub = sandbox.stub(InstallerService.prototype, "sendCommand").resolves();
        const installUrl = "http://server/bundle.swbn";
        const manifestId = "isolated-app://manifest-id";
        const remoteUrl = "http://localhost:9222";

        await installerController.installIwa(installUrl, manifestId, remoteUrl);

        sinon.assert.notCalled(launchBrowserStub);
        sinon.assert.calledOnceWithExactly(connectToBrowserStub, remoteUrl);
        sinon.assert.calledTwice(sendCommandStub);
        sinon.assert.calledWith(sendCommandStub.firstCall, "PWA.install", {
            manifestId: manifestId,
            installUrlOrBundleUrl: installUrl,
        });
        sinon.assert.calledWith(sendCommandStub.secondCall, "PWA.launch", {
            manifestId: manifestId,
        });
    });
});
