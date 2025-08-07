import * as assert from "assert";
import * as vscode from "vscode";
import * as sinon from "sinon";
import { getProjectDetails } from "../../services/iwaBuilder";

//Just a basic example, will add more tests later

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
        showInputBoxStub.onFirstCall().resolves("My Awesome IWA");

        // Simulate user entering the identifier second
        showInputBoxStub.onSecondCall().resolves("my-awesome-iwa");

        const result = await getProjectDetails();

        assert.deepStrictEqual(result, ["My Awesome IWA", "my-awesome-iwa"]);
    });
});
