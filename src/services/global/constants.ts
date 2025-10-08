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

import * as packageJson from '../../../package.json';

export const CONFIG_SECTION = packageJson.name;
//TODO:(f3bot) - Test idea (possibly in the future CL)—checking that packageJson.configuration.properties.* exists for those things here.
export const CREATE_NEW_COMMAND = packageJson.contributes.commands[0].command;
export const DEV_SERVER_COMMAND = packageJson.contributes.commands[1].command;
export const BUILD_COMMAND = packageJson.contributes.commands[2].command;
export const GENERATE_KEY_COMMAND = packageJson.contributes.commands[3].command;
export const OPEN_EXPLORER_COMMAND = packageJson.contributes.commands[4].command;
export const INSTALL_LOCAL_COMMAND = packageJson.contributes.commands[5].command;
export const INSTALL_REMOTE_COMMAND = packageJson.contributes.commands[6].command;
export const DASHBOARD_VIEW_ID = packageJson.contributes.views["iwa-studio-container"][0].id;

//Cant really extract the keys, so these have to stay hardcoded
export const CONFIG_KEY_PRIVATE_KEY = 'privateKeyName';
export const CONFIG_DEV_COMMAND = 'devServerScript';
export const CONFIG_BUILD_COMMAND = 'buildScript';
export const CONFIG_DEV_SERVER_URL = "devServerAddress";
export const CONFIG_CHROME_REMOTE_URL = "chromeRemoteServerAddress";
export const CONFIG_HTTP_SERVER_URL = "httpServerAddress";
export const CONFIG_CHROME_LAUNCH_ARGS = "chromeLaunchArguments";