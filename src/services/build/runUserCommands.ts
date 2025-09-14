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
import { verifyNpmInstalled, checkWorkspaceOpened, checkPrivateKey } from "../global/helpers";
import { BUILD_COMMAND, CONFIG_BUILD_COMMAND, CONFIG_DEV_COMMAND, CONFIG_SECTION, DEV_SERVER_COMMAND } from "../global/constants";
import { KeyManagerController } from "../keyManagement/keyManagerController";
/**
 * A generic helper function to run an npm script in a dedicated terminal.
 * It checks for a valid workspace and npm installation.
 */
function runNpmScript(scriptName: string, terminalName: string) {
    if (!verifyNpmInstalled()) {
        return;
    };

    const workspacePath = checkWorkspaceOpened();
    if (workspacePath === undefined) {return;}
    

    //If a previous terminal from this command is opened, reuse it
    const activeTerminals = vscode.window.terminals;

    for (const terminal of activeTerminals) {
        if (terminal.name === terminalName) {
            terminal.show();
            terminal.sendText(`(cd "${workspacePath.fsPath}" && ${scriptName})`);
            return;
        }
    }

    const terminal = vscode.window.createTerminal({
        name: terminalName,
        cwd: workspacePath.fsPath   ,
    });
    terminal.show();
    terminal.sendText(scriptName);
}

function runDevServerCommand() {
    const devScriptName = vscode.workspace
        .getConfiguration(CONFIG_SECTION)
        .get<string>(CONFIG_DEV_COMMAND, "npm run dev");

    runNpmScript(devScriptName, `IWA Studio: Dev Script`);
}

async function runBuildCommand(keyManager: KeyManagerController) {
    const proceed = await checkPrivateKey(keyManager);
    if (!proceed) {
        return;
    }

    const buildScriptName = vscode.workspace
        .getConfiguration(CONFIG_SECTION)
        .get<string>(CONFIG_BUILD_COMMAND, "npm run build");

    runNpmScript(buildScriptName, `IWA Studio: Build Script`);
}

export function registerWorkflowCommands(
    context: vscode.ExtensionContext,
    keyManager: KeyManagerController
) {
    const devServerDisposable = vscode.commands.registerCommand(
        DEV_SERVER_COMMAND,
        runDevServerCommand
    );

    const buildDisposable = vscode.commands.registerCommand(
        BUILD_COMMAND,
        () => runBuildCommand(keyManager)
    );

    context.subscriptions.push(devServerDisposable, buildDisposable);
}
