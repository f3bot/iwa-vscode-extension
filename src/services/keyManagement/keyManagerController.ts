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
import * as fs from "fs/promises";
import * as path from "path";
import { KeyGenerationService } from "./keyGeneration";
import { VSCodeInteractionService } from "./vscodeInteraction";
import { CONFIG_SECTION, CONFIG_KEY_PRIVATE_KEY, GENERATE_KEY_COMMAND } from "../global/constants";
import { execSync } from "child_process";
import { checkWorkspaceOpened } from "../global/helpers";
/**
 * Orchestrates key management tasks by coordinating the interaction service
 * and the key generation service with the VS Code workspace.
 */
export class KeyManagerController {

    private keyGenService: KeyGenerationService;
    private interactionService: VSCodeInteractionService;

    constructor(
        private context: vscode.ExtensionContext,
    ) {
        this.keyGenService = new KeyGenerationService();
        this.interactionService = new VSCodeInteractionService();
    }

    public async generateAndEncryptPrivateKey(): Promise<void> {
        const keyType = await this.interactionService.promptForKeyType();
        if (keyType === undefined) { return; }

        const password = await this.interactionService.promptForPassphrase();
        if (password === undefined) { return; }

        const workspaceUri = checkWorkspaceOpened();
        if (workspaceUri === undefined) { return; }

        const keyFilename = await this.interactionService.promptForKeyFilename(workspaceUri);
        if (keyFilename === undefined) { return; }

        try {
            const privateKeyData = await this.keyGenService.createPrivateKey(password, keyType);
            const filePath = path.join(workspaceUri.fsPath, keyFilename);
            await fs.writeFile(filePath, privateKeyData);
            this.interactionService.showInfo(`Encrypted key saved at: ${filePath}`);

            await this.addPemToGitIgnore();
            await this.updateKeyConfigurationIfNeeded(keyFilename);
            await this.updateEnvConfiguration(keyFilename, password);

        } catch (err) {
            this.interactionService.showError(`Failed to generate or save private key: ${err}`);
        }
    }

    private async updateKeyConfigurationIfNeeded(keyFilename: string){
        //If configured key filename remains the same, dont ask for update
        if (await this.getKeyConfiguration() === keyFilename){
            return;
        }

        if(await this.interactionService.askToUpdateDefaultKey()){
            await this.updateKeyConfiguration(keyFilename);
        }
    }

    public async updateEnvConfiguration(keyFilename: string, keyPassword: string) {
        if (await this.interactionService.offerToUpdateEnv()) {
            const workspacePath = checkWorkspaceOpened();
            if (workspacePath === undefined) {
                return;
            }

            const envPath = vscode.Uri.joinPath(workspacePath, '.env');

            try {
                const envContent = await vscode.workspace.fs.readFile(envPath);
                let envText = Buffer.from(envContent).toString("utf-8");

                const updateKey = (text: string, key: string, value: string): string => {
                    const regex = new RegExp(`^${key}=.*$`, "m");
                    if (regex.test(text)) {
                        return text.replace(regex, `${key}=${value}`);
                    }
                    return text;
                };

                envText = updateKey(envText, "PRIVATE_KEY_PATH", keyFilename);
                envText = updateKey(envText, "PRIVATE_KEY_PASSWORD", keyPassword);

                await vscode.workspace.fs.writeFile(envPath, Buffer.from(envText, "utf-8"));

                this.interactionService.showInfo("Updated PRIVATE_KEY_PATH and PRIVATE_KEY_PASSWORD in .env");

            } catch (err) {
                this.interactionService.showError(`Could not update .env, cause: ${err}`);
            }
        }
    }

    public async addPemToGitIgnore(): Promise<void> {
        const workspaceUri = checkWorkspaceOpened();
        if (workspaceUri === undefined) { return; }

        const workspacePath = workspaceUri.fsPath;

        try {
            // We use a dummy filename. If this is ignored, we assume *.pem is.
            execSync("git check-ignore --quiet test.pem", { cwd: workspacePath });
            return;
        } catch (error: any) {
            if (error.code !== 1) {
                // A different error occurred (e.g., not a git repo, git not installed).
                this.interactionService.showWarning(
                    `Could not verify .gitignore status. Please ensure "*.pem" is included in your .gitignore file. ${error}`);
                return;
            }
        }
        if (await this.interactionService.askToAddPemToGitignore()) {
            const gitignoreUri = vscode.Uri.joinPath(workspaceUri, ".gitignore");
            try {
                let content = "";
                try {
                    const contentBytes = await vscode.workspace.fs.readFile(gitignoreUri);
                    content = Buffer.from(contentBytes).toString("utf-8");
                } catch (error) {
                }
                const newContent =
                    content.trimEnd() + "\n\n# Ignore PEM certificate files\n*.pem\n";
                await vscode.workspace.fs.writeFile(gitignoreUri, Buffer.from(newContent));
                this.interactionService.showInfo("Successfully added *.pem to .gitignore.");
            } catch (error) {
                this.interactionService.showError(`Failed to modify .gitignore file: ${error}`);
            }
        }
    }

    private async getKeyConfiguration(): Promise<string | undefined> {
        return await vscode.workspace
        .getConfiguration(CONFIG_SECTION)
        .get<string>(CONFIG_KEY_PRIVATE_KEY);
    }

    private async updateKeyConfiguration(keyFilename: string): Promise<void> {
        await vscode.workspace
            .getConfiguration(CONFIG_SECTION)
            .update(CONFIG_KEY_PRIVATE_KEY, keyFilename, vscode.ConfigurationTarget.Workspace);
    }

    public async resolveSigningKey(): Promise<boolean> {
        const choice = await this.interactionService.offerInitialKeyGenerationChoice();

        switch (choice) {
            case "generate":
                await this.generateAndEncryptPrivateKey();
                return true;
            case "template":
                await this.openKeyIntegrationTemplate();
                return false;
            case "cancel":
            default:
                return false;
        }
    }

    public async openKeyIntegrationTemplate(): Promise<void> {
        try {
            const templatePath = path.join(
                this.context.extensionPath,
                "src", "templates", "ISigningStrategy.template.ts"
            );
            const templateContent = await fs.readFile(templatePath, "utf-8");

            const document = await vscode.workspace.openTextDocument({
                content: templateContent,
                language: "typescript",
            });
            await vscode.window.showTextDocument(document);
        } catch (err) {
            this.interactionService.showError(`Failed to open key integration template: ${err}`);
        }
    }

    public registerCommands(): void {
        const generateKeyCommand = vscode.commands.registerCommand(
            GENERATE_KEY_COMMAND,
            () => this.resolveSigningKey()
        );

        this.context.subscriptions.push(generateKeyCommand);
    }
}
