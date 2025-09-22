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
import { DASHBOARD_VIEW_ID } from "../../services/global/constants";
import { createDashboard, DashboardProvider } from "../../services/dashboardProvider/dashboardProvider";

suite("DashboardProvider Test Suite", () => {
    let dashboardProvider: DashboardProvider;
    let createTreeViewStub: sinon.SinonStub;

    setup(() => {
        dashboardProvider = new DashboardProvider();
        createTreeViewStub = sinon.stub(vscode.window, "createTreeView");
    });

    teardown(() => {
        sinon.restore();
    });

    test("getTreeItem returns the same element", () => {
        const treeItem = new vscode.TreeItem("Test Label") as any;
        const result = dashboardProvider.getTreeItem(treeItem);
        assert.strictEqual(result, treeItem);
    });

    test("createDashboard successfully creates a tree view", () => {
        createDashboard();
        assert.ok(createTreeViewStub.calledOnce);
        assert.strictEqual(createTreeViewStub.getCall(0).args[0], DASHBOARD_VIEW_ID);
        assert.ok(
            createTreeViewStub.getCall(0).args[1].treeDataProvider instanceof DashboardProvider,
        );
    });
});