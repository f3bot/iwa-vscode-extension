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
import extract from "extract-zip";
import path from "path";
import { pipeline } from "stream/promises";
import { changeWorkspace, verifyNpmInstalled } from "../global/helpers";
import { CONFIG_SECTION, CREATE_NEW_COMMAND } from "../global/constants";

const config = {
    bundlers: {
        Vite: {
            url: "https://github.com/GoogleChromeLabs/iwa-project-templates/releases/latest/download/vite-template.zip",
            filename: "vite-template.zip",
        },
        Webpack: {
            url: "https://github.com/GoogleChromeLabs/iwa-project-templates/releases/latest/download/webpack-template.zip",
            filename: "webpack-template.zip",
        },
    },
    manifests: {
        packageJson: "package.json",
        webManifest: path.join("public", ".well-known", "manifest.webmanifest"),
    },
    npmInstallCommand: "npm install; exit",
    envData: "PRIVATE_KEY_PATH=\nPRIVATE_KEY_PASSWORD=\nPORT=\n",
};

export async function getProjectDetails(): Promise<[string, string] | undefined> {
    const name = await vscode.window.showInputBox({
        prompt: "Enter your project name",
        placeHolder: "My Awesome IWA",
        validateInput: (text) => {
            return text.trim().length > 0 ? null : "A project name is required.";
        },
    });

    if (name === undefined) {
        vscode.window.showErrorMessage("IWA Studio: Project name is required, please try again.");
        return undefined;
    }

    const suggestedIdentifier: string = name.trim().toLowerCase().replace(/\s+|_/g, "-");
    const validationRegex: RegExp = /^[a-z0-9]+(-[a-z0-9]+)*$/;

    const identifier = await vscode.window.showInputBox({
        prompt: "Enter your project identifier",
        value: validationRegex.test(suggestedIdentifier)
            ? suggestedIdentifier
            : "e.g. my-awesome-iwa",
        validateInput: (text) => {
            if (!text.trim()) {
                return "An identifier is required.";
            }
            if (!validationRegex.test(text)) {
                return "Invalid format. Use lowercase letters, numbers, and hyphens (e.g., my-awesome-iwa).";
            }
            return null;
        },
    });

    if (identifier === undefined) {
        vscode.window.showErrorMessage(
            "IWA Studio: Project identifier is required, please try again.",
        );
        return undefined;
    }

    return [name.trim(), identifier.trim()];
}

export async function createProjectPath(projectIdentifier: string): Promise<string | undefined> {
    const parentUri = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        title: "Select parent directory",
        openLabel: "Select directory",
    });

    if (!parentUri || parentUri.length === 0) {
        vscode.window.showErrorMessage(
            "IWA Studio: The path to your project directory is required, please try again",
        );
        return undefined;
    }

    const projectPath = path.join(parentUri[0].fsPath, projectIdentifier);

    if (fs.existsSync(projectPath)) {
        vscode.window.showErrorMessage(
            `IWA Studio: A folder named ${projectIdentifier} already exists under this path! Please try again!`,
        );
        return;
    }

    await fs.promises.mkdir(projectPath, { recursive: true });

    return projectPath;
}

export async function selectBundler(): Promise<string | undefined> {
    const choices: string[] = Object.keys(config.bundlers);

    const result = await vscode.window.showQuickPick(choices, {
        title: "Choose your project bundler",
        canPickMany: false,
    });

    if (!result) {
        vscode.window.showErrorMessage("IWA Studio: Bundler selection is required.");
        return undefined;
    }

    return result;
}

export async function fetchArchive(
    bundlerChoice: string,
    destinationDirectory: string,
): Promise<string | undefined> {
    const bundlerConfig = config.bundlers[bundlerChoice as keyof typeof config.bundlers];
    if (!bundlerConfig) {
        vscode.window.showErrorMessage(`IWA Studio: Invalid bundler choice: ${bundlerChoice}`);
        return undefined;
    }

    const { url, filename } = bundlerConfig;
    const filePath = path.join(destinationDirectory, filename);

    try {
        const response = await fetch(url);
        if (!response.ok || !response.body) {
            throw new Error(
                `Failed to download template from ${url}. Status: ${response.status} ${response.statusText}`,
            );
        }
        await pipeline(response.body, fs.createWriteStream(filePath));
    } catch (error) {
        throw new Error(`Failed to download template archive.`, { cause: error });
    }

    return filename;
}

export async function processArchive(filename: string, projectPath: string): Promise<void> {
    const archivePath = path.join(projectPath, filename);

    try {
        await extract(archivePath, { dir: projectPath });

        await fs.promises.unlink(archivePath);
    } catch (error) {
        throw new Error(`Failed to extract the archive: ${archivePath}`, {
            cause: error,
        });
    }
}

/*
  Since there's no async terminal command execution api avaliable (It's still an experimental feature as of July 2025, so it might be a good idea to check up on it every now and then https://github.com/microsoft/vscode/issues/226655)
  The only solution i've found to change directories only after dependencies have been installed, is to send exit command after npm install, and listen for terminalClosed event.

*/

export async function installDependencies(projectPath: string): Promise<void> {
    if (!verifyNpmInstalled()) {
        return;
    }

    const projectName = path.basename(projectPath);
    const terminal = vscode.window.createTerminal({
        name: `IWA Studio: Install - ${projectName}`,
        cwd: projectPath, //current working directory
    });
    terminal.show();
    terminal.sendText(config.npmInstallCommand);

    return new Promise((resolve, reject) => {
        const disposeToken = vscode.window.onDidCloseTerminal((closedTerminal) => {
            if (closedTerminal === terminal) {
                disposeToken.dispose();

                if (terminal.exitStatus?.code === 0) {
                    resolve();
                } else {
                    const exitCode = terminal.exitStatus?.code ?? "unknown";
                    vscode.window.showErrorMessage(
                        "IWA Studio: npm install failed, see the terminal for details.",
                    );
                    reject(
                        new Error(
                            `'npm install' failed with exit code: ${exitCode}. Check the terminal for details.`,
                        ),
                    );
                }
            }
        });
    });
}

async function generateEnv(projectPath: string) {
    const envPath = path.join(projectPath, ".env");

    if (fs.existsSync(envPath)) {
        return;
    }

    const data = config.envData;

    try {
        await fs.promises.writeFile(envPath, data);
    } catch (err) {
        throw new Error(`Failed to generate .env, error message: ${err}`);
    }
}

async function editManifestProperties(
    projectPath: string,
    projectName: string,
    projectIdentifier: string,
): Promise<void> {
    const packageJsonPath = path.join(projectPath, config.manifests.packageJson);
    const webManifestPath = path.join(projectPath, config.manifests.webManifest);

    const manifestPaths = [packageJsonPath, webManifestPath];
    try {
        for (const manifestPath of manifestPaths) {
            const JSONData = await fs.promises.readFile(manifestPath, "utf-8");
            const packageJson = JSON.parse(JSONData);
            packageJson.name = projectName;
            packageJson.short_name = projectIdentifier;
            await fs.promises.writeFile(manifestPath, JSON.stringify(packageJson, null, 2));
        }
    } catch (error) {
        throw new Error(
            `Failed to update project manifest files. Ensure the template structure is correct.`,
            { cause: error },
        );
    }
}

export async function offerWorkspaceChange(path: string): Promise<void> {
    const choices = ["Yes", "No"];

    const result = await vscode.window.showQuickPick(choices, {
        canPickMany: false,
        title: "Would you like to open this workspace?",
    });

    if (result === "Yes") {
        changeWorkspace(path);
    } else {
        return;
    }
}

/*
  1.Get [name, idenfifier]
  2.Get directoryPath
  3.Select bundler
  4.Fetch files based on bundler
  5.Unzip files and delete archive
  6.Run npm install
  7.Generate env file with properties
  8.Edit manifest name, short_name
  9.Offer workspace change
*/
async function createNewIWA() {
    try {
        const details = await getProjectDetails();
        if (!details) {
            return;
        }

        const [projectName, projectIdentifier] = details;

        const projectPath = await createProjectPath(projectIdentifier);
        if (!projectPath) {
            return;
        }

        const bundlerChoice = await selectBundler();
        if (!bundlerChoice) {
            return;
        }

        const archive_filename = await fetchArchive(bundlerChoice, projectPath);
        if (!archive_filename) {
            return;
        }

        await processArchive(archive_filename, projectPath);

        await installDependencies(projectPath);

        await generateEnv(projectPath);

        await editManifestProperties(projectPath, projectName, projectIdentifier);

        await offerWorkspaceChange(projectPath);
    } catch (error) {
        throw new Error(`Creating new IWA failed, due to error: ${error}`);
    }
}

export function registerCreateNewCommand(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand(CREATE_NEW_COMMAND, async () => {
        await createNewIWA();
    });

    context.subscriptions.push(disposable);
}
