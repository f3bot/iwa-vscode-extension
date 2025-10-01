import fs from "node:fs";
import * as assert from "assert";
import * as vscode from "vscode";
import * as sinon from "sinon";
import path from "node:path";
import { explorerService } from "../../services/bundleExplorer/explorerService";

suite("Explorer Service test suite", async () => {
    let sandbox;
    let explorer: explorerService;
    let extensionContext: vscode.ExtensionContext;
    setup(async () => {
        sandbox = sinon.createSandbox();
        explorer = new explorerService(extensionContext);
        await vscode.extensions.getExtension("Google.iwa-studio")?.activate();
        extensionContext = (global as any).ExtensionContext;
    });

    teardown(() => {
        sinon.restore();
    });
    test("All source files should exist in third_party directory", () => {
        const third_party_path = path.join("third_party", "bundle-explorer");

        const scriptPath = path.join(third_party_path, "index.js");
        const cssPath = path.join(third_party_path, "index.css");
        const htmlPath = path.join(third_party_path, "index.html");

        assert.ok(fs.existsSync(scriptPath));
        assert.ok(fs.existsSync(cssPath));
        assert.ok(fs.existsSync(htmlPath));
    });

    test("getWebviewContent should return valid HTML content", async () => {
        const fakeWebview = vscode.window.createWebviewPanel("test", "test", vscode.ViewColumn.One);

        const htmlContent = explorer
            .getWebviewContent(fakeWebview.webview, extensionContext.extensionUri)
            .trim();

        assert.ok(htmlContent.startsWith("<!doctype html>"));
        assert.ok(htmlContent.endsWith("</html>"));
    });
});
