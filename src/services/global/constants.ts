import * as packageJson from '../../../package.json';

export const CONFIG_SECTION = packageJson.name;
//TODO:(f3bot) - Test idea (possibly in the future CL)—checking that packageJson.configuration.properties.* exists for those things here.
export const CREATE_NEW_COMMAND = packageJson.contributes.commands[0].command;
export const DEV_SERVER_COMMAND = packageJson.contributes.commands[1].command;
export const BUILD_COMMAND = packageJson.contributes.commands[2].command;
export const GENERATE_KEY_COMMAND = packageJson.contributes.commands[3].command;
export const OPEN_EXPLORER_COMMAND = packageJson.contributes.commands[4].command;
export const DASHBOARD_VIEW_ID = packageJson.contributes.views["iwa-studio-container"][0].id;

//Cant really extract the keys, so these have to stay hardcoded
export const CONFIG_KEY_PRIVATE_KEY = 'privateKeyName';
export const CONFIG_DEV_COMMAND = 'devServerScript';
export const CONFIG_BUILD_COMMAND = 'buildScript';
