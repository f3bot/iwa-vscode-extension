import * as vscode from "vscode";
import { checkNpmInstalled } from "../global/helpers";
/**
 * A generic helper function to run an npm script in a dedicated terminal.
 * It checks for a valid workspace and npm installation.
 */
function runNpmScript(scriptName: string, terminalName: string) {
    if(!checkNpmInstalled()){
        return;
    }

    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspacePath) {
        vscode.window.showErrorMessage(
            "No workspace detected. Please open your IWA project folder.",
        );
        return;
    }

    //If a previous terminal from this command is opened, reuse it
    const activeTerminals = vscode.window.terminals;

    for (const terminal of activeTerminals) {
        if (terminal.name === terminalName) {
            terminal.show();
            terminal.sendText(scriptName);
            return;
        }
    }

    const terminal = vscode.window.createTerminal(terminalName);
    terminal.show();
    terminal.sendText(scriptName);
}

function runDevServerCommand() {
    const devScriptName = vscode.workspace
        .getConfiguration("iwa-studio")
        .get<string>("devServerScript", "npm run dev");

    runNpmScript(devScriptName, `IWA Studio: ${devScriptName}`);
}

async function runBuildCommand() {
    const buildScriptName = vscode.workspace
        .getConfiguration("iwa-studio")
        .get<string>("buildScript", "npm run build");

    runNpmScript(buildScriptName, `IWA Studio: ${buildScriptName}`);
}

export function registerWorkflowCommands(context: vscode.ExtensionContext) {
    const devServerDisposable = vscode.commands.registerCommand("iwa-studio.runDevServer", runDevServerCommand);
    const buildDisposable = vscode.commands.registerCommand("iwa-studio.runBuild", runBuildCommand);

    context.subscriptions.push(devServerDisposable, buildDisposable);
}
