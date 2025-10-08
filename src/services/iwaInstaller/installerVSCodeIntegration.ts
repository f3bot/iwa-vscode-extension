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

import * as vscode from "vscode";
import * as fs from "node:fs/promises";
import { getBundleId } from "wbn-sign";
import {
    CONFIG_CHROME_LAUNCH_ARGS,
    CONFIG_CHROME_REMOTE_URL,
    CONFIG_DEV_SERVER_URL,
    CONFIG_HTTP_SERVER_URL,
    CONFIG_SECTION,
} from "../global/constants";

export class InstallerVSCodeIntegration {
    public readonly DEV_PROXY_INSTALLATION_CHOICE: string;
    public readonly SIGNED_BUNDLE_INSTALLATION_CHOICE: string;

    constructor() {
        this.DEV_PROXY_INSTALLATION_CHOICE = "Install with dev proxy";
        this.SIGNED_BUNDLE_INSTALLATION_CHOICE = "Install with a signed web bundle file";
    }

    public async showError(message: string, action?: string) {
        if (action) {
            const result = await vscode.window.showErrorMessage(
                `IWA Studio: ${message}`,
                { modal: true }, //Makes error appear in the middle of the screen
                action,
            );

            if (result === action) {
                vscode.commands.executeCommand("workbench.action.openSettings", CONFIG_SECTION);
            }

            return;
        }

        vscode.window.showErrorMessage(`IWA Studio: ${message}`);
    }

    public showWarning(message: string) {
        vscode.window.showWarningMessage(`IWA Studio: ${message}`);
    }

    public getChromeLaunchArgs(){
        return vscode.workspace
        .getConfiguration(CONFIG_SECTION)
        .get<string>(CONFIG_CHROME_LAUNCH_ARGS);
    }       

    public async getRemoteConnection(): Promise<string | undefined> {
        const remoteServer = vscode.workspace
            .getConfiguration(CONFIG_SECTION)
            .get<string>(CONFIG_CHROME_REMOTE_URL);

        if (remoteServer === undefined || remoteServer.length === 0) {
            this.showError("Chrome remote debugging server not specified in extension settings", "Open Settings");
        }
    
        let inputValue: string;

        remoteServer ? (inputValue = remoteServer) : (inputValue = "http://localhost:CHROME_DEBUG_PORT/");

        const remoteConnection = await vscode.window.showInputBox({
            value: inputValue,
            title: "Input your Chrome remote debugging server",
        });

        if (remoteConnection === undefined) {
            this.showError("Chrome remote server not provided, please try again");
            return;
        }

        return remoteConnection;
    }

    public async getHttpServerUrl(installFile: string) {
        const configHttpServer = vscode.workspace
            .getConfiguration(CONFIG_SECTION)
            .get<string>(CONFIG_HTTP_SERVER_URL);

        if (configHttpServer === undefined || configHttpServer.length === 0) {
            this.showError("HTTP server not specified in extension settings", "Open Settings");
        }

        let inputValue: string;

        /*
        installFile is a path /home/user/some_directory/bundle.swbn
        we want to serve the file from a server, so http://localhost/bundle.swbn
        */
        const fileName = installFile.split("/").pop();

        configHttpServer
            ? (inputValue = `${configHttpServer}/${fileName}`)
            : (inputValue = `http://localhost:HTTP_SERVER_PORT/${fileName}`);
        const httpServer = await vscode.window.showInputBox({
            value: inputValue,
            title: "Input the URL to your .swbn file on localhost server sharing your bundle",
        });

        if (httpServer === undefined) {
            this.showError("HTTP server not provided, please try again");
            return;
        }

        return httpServer;
    }

    public async askForLocalhostServer(): Promise<string | undefined> {
        let localHostServer = vscode.workspace
            .getConfiguration(CONFIG_SECTION)
            .get<string>(CONFIG_DEV_SERVER_URL);
            
        if (localHostServer === undefined || localHostServer.length === 0) {
            const permission = await vscode.window.showInformationMessage(
                "Localhost development server not specified in extension settings. Allow reading PORT from .env file?",
                { modal: true },
                "Yes",
                "No"
            );

            if (permission === "Yes") {
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (workspaceFolders && workspaceFolders.length > 0) {
                    const envPath = vscode.Uri.joinPath(workspaceFolders[0].uri, ".env");
                    try {
                        const envContent = await vscode.workspace.fs.readFile(envPath);
                        const envText = Buffer.from(envContent).toString("utf8");
                        const portMatch = envText.match(/^PORT=(.*)$/m);
                        if (portMatch && portMatch[1]) {
                            const port = portMatch[1].trim();
                            localHostServer = `http://localhost:${port}`;

                            vscode.workspace.getConfiguration(CONFIG_SECTION).update(CONFIG_DEV_SERVER_URL, localHostServer);
                        } else {
                            this.showWarning("PORT variable not found in your .env file.");
                        }
                    } catch (e) {
                        this.showWarning(".env file not found in your workspace root.");
                    }
                }
            }
        }

        const inputValue = localHostServer ?? "http://localhost:DEV_SERVER_PORT";

        const localhost = await vscode.window.showInputBox({
            title: "Input your localhost development server",
            value: inputValue,
        });

        if (localhost === undefined) {
            this.showError("No localhost development server provided, please try again");
            return;
        }

        return localhost;
    }

    public async askForInstallationType(): Promise<string | undefined> {
        const choices: string[] = [
            this.DEV_PROXY_INSTALLATION_CHOICE,
            this.SIGNED_BUNDLE_INSTALLATION_CHOICE,
        ];
        const result = await vscode.window.showQuickPick(choices, {
            canPickMany: false,
            ignoreFocusOut: true,
            title: "How do you want to install your Isolated Web App?",
        });

        if (result === undefined) {
            return;
        }

        return result;
    }

    public async getManifestId(bundlePath: string) {
        const content = await fs.readFile(bundlePath);
        const u8content = new Uint8Array(Buffer.from(content));
        const manifestOrigin = getBundleId(u8content);
        return `isolated-app://${manifestOrigin}`;
    }

    public async getBundlePath(): Promise<string | undefined> {
        const bundleFiles = await vscode.workspace.findFiles("**/*.swbn", "**/node_modules");

        if (bundleFiles.length === 0) {
            this.showError("No .swbn bundle file found in the workspace.");
            return;
        }
        if (bundleFiles.length === 1) {
            return bundleFiles[0].fsPath;
        } else {
            this.showWarning("Multiple bundles found. Please select the one you want to install.");

            const bundlePaths = bundleFiles.map((file) => file.fsPath);

            const result = await vscode.window.showQuickPick(bundlePaths, {
                placeHolder: "Select the bundle file to install",
            });

            if (result === undefined) {
                this.showError("No bundle file selected, please try again");
                return;
            }

            return result;
        }
    }
}
