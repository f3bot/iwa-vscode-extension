/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as vscode from "vscode";
import { existsSync } from "node:fs";

enum KeyGenerationChoice {
    GENERATE = "generate",
    TEMPLATE = "template",
    CANCEL = "cancel"
}

export enum PrivateKeyType{
    P256 = 'p-256',
    ED25519 = 'ed25519'
}
/**
 * Manages all user-facing interactions like prompts, and quick picks.
 */
export class VSCodeInteractionService {
    private readonly UI_CHOICE_YES = "Yes";
    private readonly UI_CHOICE_NO = "No";

    public showError(message: string) {
        vscode.window.showErrorMessage(`IWA Studio: ${message}`);
    }

    public showInfo(message: string) {
        vscode.window.showInformationMessage(`IWA Studio: ${message}`);
    }

    public showWarning(message: string){
        vscode.window.showWarningMessage(`IWA Studio: ${message}`);
    }

    public fileExists(filePath: string): boolean {
        return existsSync(filePath);
    }

    public async askToOverwrite(filename: string): Promise<boolean> {
        const result = await vscode.window.showQuickPick(
            [this.UI_CHOICE_YES, this.UI_CHOICE_NO],
            {
                title: `The file '${filename}' already exists. Are you sure you want to overwrite it?`,
                canPickMany: false,
                ignoreFocusOut: true,
            }
        );
        return result === this.UI_CHOICE_YES;
    }

    public async promptForKeyFilename(workspaceUri: vscode.Uri): Promise<string | undefined> {
        let filename = await vscode.window.showInputBox({
            title: "Enter your encrypted key filename",
            value: "encrypted_key.pem",
            ignoreFocusOut: true,
        });

        if (filename === undefined) { //User cancelled
            this.showError("Key generation cancelled, no filename given.");
            return; 
        }

        const fileUri = vscode.Uri.joinPath(workspaceUri, filename);
        if (this.fileExists(fileUri.fsPath)) {
            const shouldOverwrite = await this.askToOverwrite(filename);
            if (!shouldOverwrite) {
                // Relaunch the prompt if the user decides not to overwrite
                return this.promptForKeyFilename(workspaceUri);
            }
        }

        return filename;
    }

    public async promptForKeyType(): Promise<PrivateKeyType | undefined> {
        const keyTypes = [PrivateKeyType.ED25519, PrivateKeyType.P256];
        const result = await vscode.window.showQuickPick(keyTypes, {
            title: "Select the type of key to generate",
            canPickMany: false,
            ignoreFocusOut: true,
        });

        if(result === undefined) { return; }

        if (result === PrivateKeyType.ED25519) {
            return PrivateKeyType.ED25519;
        }

        if (result === PrivateKeyType.P256) {
            return PrivateKeyType.P256;
        }
    }

    public async promptForPassphrase(): Promise<string | undefined> {
        const password = await vscode.window.showInputBox({
            title: "Provide a strong password to encrypt your private key (optional)",
            prompt: "Leave this empty if you do not want to encrypt the key.",
            password: true,
            ignoreFocusOut: true,
        });

        if (password === undefined) { //Prompt cancelled
            this.showError("Key generation cancelled, no passphrase given");
            return;
        } 

        // User provided an empty string, ask for confirmation
        if (password.length === 0) {
            const choices = ["Yes, create key with no password", "No, let me cancel"];
            const answer = await vscode.window.showQuickPick(choices, {
                title: "You did not provide a password. The key will not be encrypted.",
                ignoreFocusOut: true,
            });

            return answer === choices[0] ? "" : undefined;
        }

        return password;
    }

    public async askToUpdateDefaultKey(): Promise<boolean> {
        const result = await vscode.window.showQuickPick(
            [this.UI_CHOICE_YES, this.UI_CHOICE_NO],
            {
                title: "Would you like to use this new key as the default for this workspace?",
            }
        );
        return result === this.UI_CHOICE_YES;
    }

    public async askToAddPemToGitignore(): Promise<boolean> {
        const result = await vscode.window.showQuickPick(
            [this.UI_CHOICE_YES, this.UI_CHOICE_NO],
            {
                title: "Add *.pem to your .gitignore?",
                placeHolder: "This will prevent certificate files from being committed.",
            }
        );
        return result === this.UI_CHOICE_YES;
    }

    public async offerInitialKeyGenerationChoice(): Promise<KeyGenerationChoice> {
        const choices = {
            generate: "Generate private key",
            template: "Open key integration template",
        };

        const result = await vscode.window.showQuickPick(Object.values(choices), {
            title: "It seems you don't have a private key in this workspace.",
            placeHolder: "What would you like to do?",
        });

        if (result === choices.generate) { return KeyGenerationChoice.GENERATE; }
        if (result === choices.template) { return KeyGenerationChoice.TEMPLATE; }
        return KeyGenerationChoice.CANCEL;
    }
}