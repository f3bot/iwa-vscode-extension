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
import { registerCreateNewCommand } from "./services/build/iwaBuilder";
import { registerWorkflowCommands } from "./services/build/runUserCommands";
import { KeyManagerController } from "./services/keyManagement/keyManagerController";
import { createDashboard } from "./services/dashboardProvider/dashboardProvider";
import { explorerService } from "./services/bundleExplorer/explorerService";

export function activate(context: vscode.ExtensionContext) {
    const keyManager = new KeyManagerController(context);
    keyManager.registerCommands();

    const bundleExplorer = new explorerService(context);
    bundleExplorer.registerCommands();



    registerCreateNewCommand(context); // createNewIwa()
    registerWorkflowCommands(context, keyManager); //npm run dev and build scripts

    //This is done to access extensionContext in tests.
    //https://github.com/microsoft/vscode/blob/main/extensions/vscode-api-tests/src/singlefolder-tests/state.test.ts
    (global as any).ExtensionContext = context;

    createDashboard();
}

export function deactivate() {}
