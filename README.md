# IWA Studio: Streamline Your Isolated Web App Development

IWA Studio is a VS Code extension designed to provide a smooth, integrated experience for developing [Isolated Web Apps (IWAs)](https://developer.chrome.com/docs/web-platform/isolated-web-apps/). It provides a rich set of tools to create, build, sign, and install your IWAs without leaving your editor.

## Features

-   **Project Scaffolding**: Quickly start a new IWA project from official templates.
-   **Developer Dashboard**: A dedicated view in the activity bar for easy access to all key features.
-   **Build & Dev Integration**: Run your development server and build scripts directly from the dashboard.
-   **Key Management**: Generate encrypted `ed25519` or `p-256` private keys for signing your web bundles.
-   **Bundle Explorer**: Inspect the contents of your Signed Web Bundle (`.swbn`) files within VS Code.
-   **IWA Installation**: Install your IWA on a local or remote Chrome instance for testing and debugging.
-   **Bundle ID Extraction**: Easily get the Bundle ID from a `.swbn` file via the context menu.

## Developer Dashboard

IWA Studio adds a new icon to the activity bar, which opens the Developer Dashboard. This dashboard provides a user-friendly tree view to access the extension's core functionalities, categorized into Project, Tools, and Installation.

## Available Commands

You can access these commands from the VS Code Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`) or the Developer Dashboard:

-   **IWA Studio: Create new IWA**: Scaffolds a new IWA project.
-   **IWA Studio: Run Dev Script**: Runs the development server script defined in your settings.
-   **IWA Studio: Run Build Script**: Runs the production build script defined in your settings.
-   **IWA Studio: Generate Private Key**: Generates a new encrypted private key for signing your IWA.
-   **IWA Studio: Open Bundle Explorer**: Opens the Web Bundle Explorer to inspect a `.swbn` file.
-   **IWA Studio: Launch Chrome and install IWA**: Installs your IWA on a locally running Chrome instance.
-   **IWA Studio: Connect to Chrome and install IWA**: Installs your IWA on a remote Chrome instance.


## Extension Settings

Customize IWA Studio's behavior by modifying these settings in your workspace or user `settings.json`:

-   `iwa-studio.devServerScript`: The npm script to run the development server (default: `npm run dev`).
-   `iwa-studio.buildScript`: The npm script to build the IWA for production (default: `npm run build`).
-   `iwa-studio.privateKeyName`: The filename for your encrypted private key (default: `encrypted_key.pem`).
-   `iwa-studio.devServerAddress`: The address of your local development server.
-   `iwa-studio.chromeRemoteServerAddress`: The address of your remote Chrome debugging server for remote installation.
-   `iwa-studio.httpServerAddress`: The address for the local HTTP server that hosts the Signed Web Bundle for remote installation.
-   `iwa-studio.chromeLaunchArguments`: Custom arguments for launching Chrome (default: `--enable-features=IsolatedWebApps,IsolatedWebAppDevMode`).

---

This is not an officially supported Google product. This project is not eligible for the [Google Open Source Software Vulnerability Rewards Program](https://bughunters.google.com/open-source-security).