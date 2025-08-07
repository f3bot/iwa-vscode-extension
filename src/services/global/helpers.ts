import * as vscode from "vscode";
import * as shell from "shelljs";

export function changeWorkspace(path: string) {
    let uri = vscode.Uri.file(path);
    vscode.commands.executeCommand("vscode.openFolder", uri);
}

export function checkNpmInstalled(): boolean {
    if (!shell.which("npm")) {
        vscode.window.showErrorMessage(
            "IWA Studio: This command requires npm. Install npm at https://www.npmjs.com/",
        );
        return false;
    }

    return true;
}
