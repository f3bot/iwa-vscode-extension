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

import * as puppeteer from "puppeteer-core";
import type { ProtocolMapping } from "devtools-protocol/types/protocol-mapping";
import { base32Encode } from "../../lib/base32";
import { InstallerVSCodeIntegration } from "./installerVSCodeIntegration";
export class InstallerService {
    private session: Promise<puppeteer.CDPSession> | null;
    private browser: puppeteer.Browser | null;
    private vscodeIntegration: InstallerVSCodeIntegration;

    constructor(vscodeIntegration: InstallerVSCodeIntegration) {
        this.session = null;
        this.browser = null;
        this.vscodeIntegration = vscodeIntegration;
    }

    public async launchBrowser() {
        const display = process.env.DISPLAY;
        if(display === undefined){
            this.vscodeIntegration.showError("DISPLAY variable is not set, cannot launch chrome");
            return;
        }

        const launchArgs = this.vscodeIntegration.getChromeLaunchArgs();

        if(launchArgs === undefined){
            this.vscodeIntegration.showError("Chrome launch arguments are not set in settings.", "Open Settings");
            return;
        }

        this.browser = await puppeteer.launch({
            headless: false,
            args: ["--window-size=800x800", ...launchArgs.split(";")],
            pipe: true,
            executablePath: puppeteer.executablePath("chrome"),
        });

        this.session = this.browser.target().createCDPSession();
    }

    public async connectToBrowser(remoteUrl: string) {
        this.browser = await puppeteer.connect({
            browserURL: remoteUrl,
        });

        this.session = this.browser.target().createCDPSession();
    }

    public generateBundleId() {
        const buffer = new Uint8Array(35);
        crypto.getRandomValues(buffer.subarray(0, 31));

        buffer[32] = 0x00;
        buffer[33] = 0x00;
        buffer[34] = 0x02;

        const bundleId = base32Encode(buffer);

        return `isolated-app://${bundleId}`;
    }

    public async sendCommand<T extends keyof ProtocolMapping.Commands>(
        message: T,
        params?: ProtocolMapping.Commands[T]["paramsType"][0],
    ) {
        if (!this.session) {
            throw new Error("Browser session not initialized.");
        }
        try {
            const session = await this.session;
            return await session.send(message, params);
        } catch (error) {
            throw new Error(
                `Failed to send ${message} command to Chrome Instance, cause: ${error}`,
            );
        }
    }
}
