import * as vscode from "vscode";
import { registerCreateNewCommand } from "./services/iwaBuilder";
import { registerWorkflowCommands } from "./services/build/runUserCommands";

export function activate(context: vscode.ExtensionContext) {
    registerCreateNewCommand(context); // createNewIwa()
    registerWorkflowCommands(context);
}

export function deactivate() {}
