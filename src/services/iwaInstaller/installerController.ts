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
import { InstallerService } from "./installerService";
import { InstallerVSCodeIntegration } from "./installerVSCodeIntegration";
import { INSTALL_LOCAL_COMMAND, INSTALL_REMOTE_COMMAND } from "../global/constants";

export class InstallerController {
    private context: vscode.ExtensionContext;
    private installerService: InstallerService;
    private vscodeIntegration: InstallerVSCodeIntegration;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.vscodeIntegration = new InstallerVSCodeIntegration();
        this.installerService = new InstallerService(this.vscodeIntegration);
    }

    public async installIwa(
        installUrlOrBundleUrl: string,
        manifestID: string,
        remoteUrl?: string,
    ) {
        try {
            if (remoteUrl) {
                await this.installerService.connectToBrowser(remoteUrl);
            } else {
                await this.installerService.launchBrowser();
            }

            await this.installerService.sendCommand("PWA.install", {
                manifestId: manifestID,
                installUrlOrBundleUrl: installUrlOrBundleUrl
            });

            await this.installerService.sendCommand("PWA.launch", {
                manifestId: manifestID,
            });

        } catch (error) {
            this.vscodeIntegration.showError(error as any);
        }
    }

    public async getDevProxyConfig() {
        const localhostServer = await this.vscodeIntegration.askForLocalhostServer();
        if (localhostServer === undefined) {
            return;
        }
        return {
            installUrlOrBundleUrl: localhostServer,
            manifestID: this.installerService.generateBundleId(),
        };
    }

    public async getBundleConfig(isLocalInstallation: boolean) {
        const bundlePath = await this.vscodeIntegration.getBundlePath();
        if (bundlePath === undefined) {
            return;
        }

        const manifestID = await this.vscodeIntegration.getManifestId(bundlePath);
        if (manifestID === undefined) {
            return;
        }

        if (isLocalInstallation) {
            return {
                installUrlOrBundleUrl: `file://${bundlePath}`,
                manifestID: manifestID,
            };
        }

        const httpServerFileUrl = await this.vscodeIntegration.getHttpServerUrl(bundlePath);
        if (httpServerFileUrl === undefined) {
            return;
        }
        return {
            installUrlOrBundleUrl: httpServerFileUrl,
            manifestID: manifestID,
        };
    }

    private async getInstallationConfig(isLocalInstallation: boolean) {
        const installationType = await this.vscodeIntegration.askForInstallationType();
        if (installationType === undefined) {
            return;
        }

        if (installationType === this.vscodeIntegration.DEV_PROXY_INSTALLATION_CHOICE) {
            return this.getDevProxyConfig();
        } else {
            return this.getBundleConfig(isLocalInstallation);
        }
    }



    public async installIwaLocally() {
        const config = await this.getInstallationConfig(true);
        if (config === undefined) {
            return;
        }

        await this.installIwa(config.installUrlOrBundleUrl, config.manifestID);
    }

    public async installIwaRemotely() {
        const remoteConnection = await this.vscodeIntegration.getRemoteConnection();
        if (remoteConnection === undefined) {
            return;
        }
        const config = await this.getInstallationConfig(false);
        if (config === undefined) {
            return;
        }

        await this.installIwa(config.installUrlOrBundleUrl, config.manifestID, remoteConnection);
    }

    public registerCommands() {
        const installLocallyDisposable = vscode.commands.registerCommand(
            INSTALL_LOCAL_COMMAND,
            () => this.installIwaLocally(),
        );

        const installRemotelyDisposable = vscode.commands.registerCommand(
            INSTALL_REMOTE_COMMAND,
            () => this.installIwaRemotely(),
        );

        this.context.subscriptions.push(installLocallyDisposable, installRemotelyDisposable);
    }
}
