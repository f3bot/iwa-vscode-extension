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
import { verifyNpmInstalled } from "../global/helpers";
/**
 * A generic helper function to run an npm script in a dedicated terminal.
 * It checks for a valid workspace and npm installation.
 */
function runNpmScript(scriptName: string, terminalName: string) {
    if (!verifyNpmInstalled()) {
        return;
    }

    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspacePath) {
        vscode.window.showErrorMessage(
            "No workspace detected. Please open your IWA project folder.",
        );
        return;
    }

    const activeTerminals = vscode.window.terminals;

    //If a previous terminal from this command is opened, reuse it
    for (const terminal of activeTerminals) {
        if (terminal.name === terminalName) {
            terminal.show();
            terminal.sendText(`(cd "${workspacePath}" && ${scriptName})`);
            return;
        }
    }

    const terminal = vscode.window.createTerminal({
        name: terminalName,
        cwd: workspacePath,
    });

    terminal.show();
    terminal.sendText(scriptName);
}

function runDevServerCommand() {
    const devScriptName = vscode.workspace
        .getConfiguration("iwa-studio")
        .get<string>("devServerScript", "npm run dev");

    runNpmScript(devScriptName, `IWA Studio: Dev Script`);
}

async function runBuildCommand() {
    const buildScriptName = vscode.workspace
        .getConfiguration("iwa-studio")
        .get<string>("buildScript", "npm run build");

    runNpmScript(buildScriptName, `IWA Studio: Build Script`);
}

export function registerWorkflowCommands(context: vscode.ExtensionContext) {
    const devServerDisposable = vscode.commands.registerCommand(
        "iwa-studio.runDevServer",
        runDevServerCommand,
    );
    const buildDisposable = vscode.commands.registerCommand("iwa-studio.runBuild", runBuildCommand);

    context.subscriptions.push(devServerDisposable, buildDisposable);
}
