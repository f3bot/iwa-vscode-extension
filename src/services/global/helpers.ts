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

import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import * as shell from "shelljs";
import { KeyManagerController } from "../keyManagement/keyManagerController";
import { CONFIG_KEY_PRIVATE_KEY, CONFIG_SECTION, GET_BUNDLE_ID_COMMAND } from "./constants";
import { getBundleId } from "wbn-sign";

export function changeWorkspace(path: string) {
    let uri = vscode.Uri.file(path);
    vscode.commands.executeCommand("vscode.openFolder", uri);
}

export function verifyNpmInstalled(): boolean {
    if (!shell.which("npm")) {
        vscode.window.showErrorMessage(
            "IWA Studio: This command requires npm. Install npm at https://www.npmjs.com/"
        );
        return false;
    }

    return true;
}

export function checkWorkspaceOpened() {
    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri;
    if (workspacePath === undefined) {
        vscode.window.showErrorMessage(
            'No workspace detected. Please open your IWA project folder.'
        );
        return;
    }

    return workspacePath;
}

export async function checkPrivateKey(keyManager: KeyManagerController): Promise<boolean> {
  const openSettingsAction = 'Open Settings';
  const keyFilename = vscode.workspace
    .getConfiguration(CONFIG_SECTION)
    .get<string>(CONFIG_KEY_PRIVATE_KEY);

  if (keyFilename === undefined) {
    const actionResult = await vscode.window.showErrorMessage(
      'IWA Studio: Private key name not specified, visit extension settings to update it.',
      openSettingsAction
    );

    if (actionResult === openSettingsAction) {
      vscode.commands.executeCommand(
        'workbench.action.openWorkspaceSettings',
        CONFIG_SECTION
      );
    }

    return false;
  }

  const workspaceFolder = checkWorkspaceOpened();
  if (workspaceFolder === undefined) {
    return false;
  }
  const filePath = path.join(workspaceFolder.fsPath, keyFilename);

  try {
    await fs.promises.stat(filePath);
    return true;
  } catch (error) {
    const proceedWithBuild = await keyManager.resolveSigningKey();
    return proceedWithBuild;
  }
}

async function getBundleIdFromFile(file : vscode.Uri){
  const fileContents = await fs.promises.readFile(file.fsPath);
  const bundleID = getBundleId(fileContents);

  vscode.window.showInformationMessage(`IWA Studio: Bundle ID copied to clipboard! \n isolated-app://${bundleID}`);
  vscode.env.clipboard.writeText(`isolated-app://${bundleID}`);
};

export function registerGetBundleIDCommand(context: vscode.ExtensionContext){
  const bundleIdDisposable = vscode.commands.registerCommand(GET_BUNDLE_ID_COMMAND, (file: vscode.Uri) =>{
    getBundleIdFromFile(file);
  });

  context.subscriptions.push(bundleIdDisposable);
}