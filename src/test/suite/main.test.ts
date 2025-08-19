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

import * as assert from "assert";
import * as vscode from "vscode";
import * as sinon from "sinon";
import { getProjectDetails } from "../../services/build/iwaBuilder";

//This test is not supposed to be anything meaningful, it's just a basic test to verify that test runner is working.

suite("IWA Builder Suite", () => {
    let sandbox: sinon.SinonSandbox;

    setup(() => {
        sandbox = sinon.createSandbox();
    });

    teardown(() => {
        sandbox.restore();
    });

    // Test case for successfully getting project details
    test("getProjectDetails should return name and identifier when user provides input", async () => {
        // Arrange: Fake the vscode.window.showInputBox to simulate user input
        const showInputBoxStub = sandbox.stub(vscode.window, "showInputBox");

        // Simulate user entering the project name first
        showInputBoxStub.onFirstCall().resolves("IWA Project");

        // Simulate user entering the identifier second
        showInputBoxStub.onSecondCall().resolves("iwa-project");

        const result = await getProjectDetails();

        assert.deepStrictEqual(result, ["IWA Project", "iwa-project"]);
    });
});
