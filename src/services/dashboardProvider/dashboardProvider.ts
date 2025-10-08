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
import {
    BUILD_COMMAND,
    CREATE_NEW_COMMAND,
    DASHBOARD_VIEW_ID,
    DEV_SERVER_COMMAND,
    GENERATE_KEY_COMMAND,
    INSTALL_LOCAL_COMMAND,
    INSTALL_REMOTE_COMMAND,
    OPEN_EXPLORER_COMMAND,
} from "../global/constants";

enum CATEGORY {
    PROJECT = "Project",
    TOOLS = "Tools",
    INSTALLATION = "Installation"
}

class DashboardTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly category?: string,
        public command?: vscode.Command,
    ) {
        super(label, collapsibleState);
    }
}

//icons sourced from https://code.visualstudio.com/api/references/icons-in-labels
const DASHBOARD_ITEMS = [
    {
        category: CATEGORY.PROJECT,
        label: "Create new IWA",
        description: "Create your new IWA",
        icon: "add",
        commandId: CREATE_NEW_COMMAND,
    },
    {
        category: CATEGORY.PROJECT,
        label: "Run Dev",
        description: "Run your specified dev server script",
        icon: "debug-start",
        commandId: DEV_SERVER_COMMAND,
    },
    {
        category: CATEGORY.PROJECT,
        label: "Run Build",
        description: "Run your specified build script",
        icon: "package",
        commandId: BUILD_COMMAND,
    },
    {
        category: CATEGORY.TOOLS,
        label: "Generate key",
        description: "Generate an encrypted ed-25519/p-256 key",
        icon: "key",
        commandId: GENERATE_KEY_COMMAND,
    },
    {
        category: CATEGORY.TOOLS,
        label: "Open Explorer",
        description: "Open Bundle Explorer",
        icon: "eye",
        commandId: OPEN_EXPLORER_COMMAND,
    },
    {
        category: CATEGORY.INSTALLATION,
        label: "Install IWA Locally",
        description: "",
        icon: "beaker",
        commandId: INSTALL_LOCAL_COMMAND,
    },
    {
        category: CATEGORY.INSTALLATION,
        label: "Install IWA Remotely",
        description: "",
        icon: "remote",
        commandId: INSTALL_REMOTE_COMMAND,
    },
];

export class DashboardProvider implements vscode.TreeDataProvider<DashboardTreeItem> {
    getTreeItem(element: DashboardTreeItem): DashboardTreeItem {
        return element;
    }

    getChildren(element?: DashboardTreeItem): vscode.ProviderResult<DashboardTreeItem[]> {
        if (element) {
            return DASHBOARD_ITEMS.filter((item) => item.category === element.label).map((item) => {
                const treeItem = new DashboardTreeItem(
                    item.label,
                    vscode.TreeItemCollapsibleState.None,
                );
                treeItem.description = item.description;
                treeItem.iconPath = new vscode.ThemeIcon(item.icon);
                treeItem.command = {
                    command: item.commandId,
                    title: `IWA Studio: ${item.label}`,
                };
                return treeItem;
            });
        } else {
            const categories = [...new Set(DASHBOARD_ITEMS.map((item) => item.category))];
            return categories.map(
                (category) =>
                    new DashboardTreeItem(category, vscode.TreeItemCollapsibleState.Expanded),
            );
        }
    }
}

export function createDashboard() {
    vscode.window.createTreeView(DASHBOARD_VIEW_ID, {
        treeDataProvider: new DashboardProvider(),
    });
}