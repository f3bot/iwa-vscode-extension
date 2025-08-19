# IWA Studio: Streamline Your Isolated Web App Development

IWA Studio is designed to give you a smooth, integrated experience for developing Isolated Web Apps
(IWAs).

## Features

- **Quick Start with Templates:** Jumpstart your IWA project using pre-built templates from
  [iwa-project-templates](https://github.com/GoogleChromeLabs/iwa-project-templates).
- **Effortless Development & Building:** Easily run a development server or build your IWA with our
  convenient built-in commands.

## Available Commands

Access these commands from the VS Code Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`):

-   **IWA Studio: Start Development Server**: This command executes the script defined in the IWA Studio: Dev Server Script setting.

-   **IWA Studio: Build IWA**: This command uses the script defined in the IWA Studio: Build Script setting.

-   **IWA Studio: Create new IWA**: Scaffolds a new project by cloning a pre-built template from the official [GoogleChromeLabs/iwa-project-templates](https://github.com/GoogleChromeLabs/iwa-project-templates) repository. This gives you a ready-to-use foundation for your app.
## Extension Settings

IWA Studio offers the following customizable settings:

- `iwa-studio.devServerScript`: Modify your default npm development command (e.g., `npm run dev`).
- `iwa-studio.buildScript`: Change your default npm build command (e.g., `npm run build`).

**Important:** If you customize your Dev Server Script or Build Script, remember to update these
settings in IWA Studio to ensure the extension's commands function correctly.
