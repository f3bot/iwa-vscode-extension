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
import * as fs from "fs";
import { OPEN_EXPLORER_COMMAND } from "../global/constants";
export class explorerService {
    private readonly context: vscode.ExtensionContext;
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    private getContentPath(extensionUri: vscode.Uri){
        return vscode.Uri.joinPath(extensionUri, 'third_party', "bundle-explorer");
    }

    //Source files have been built from https://github.com/robbiemc/wbn-explorer
    public getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
        const contentPath = this.getContentPath(extensionUri);
        const htmlPath = vscode.Uri.joinPath(contentPath, "index.html");
        let htmlContent = fs.readFileSync(htmlPath.fsPath, "utf8");

        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(contentPath,"index.js"),
        );
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(contentPath, "index.css"),
        );

        htmlContent = htmlContent.replace("${styleUri}", styleUri.toString());
        htmlContent = htmlContent.replace("${scriptUri}", scriptUri.toString());

        return htmlContent;
    }

    registerCommands() {
        const contentPath = this.getContentPath(this.context.extensionUri);
        let disposable = vscode.commands.registerCommand(OPEN_EXPLORER_COMMAND, () => {
            const panel = vscode.window.createWebviewPanel(
                "Web Bundle Explorer", 
                "Web Bundle Explorer", 
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    localResourceRoots: [contentPath], //Allow files from this particular folder
                },
            );

            panel.webview.html = this.getWebviewContent(panel.webview, this.context.extensionUri);
        });

        this.context.subscriptions.push(disposable);
    }
}
