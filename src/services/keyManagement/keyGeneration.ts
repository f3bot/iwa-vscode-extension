/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { generateKeyPair } from "node:crypto";
import { promisify } from "node:util";
import { PrivateKeyType } from "./vscodeInteraction";

/**
 * Handles the core cryptographic operations.
 */
export class KeyGenerationService {
    private generateKeyPairPromise = promisify(generateKeyPair);
    public async createPrivateKey(passphrase: string, keyType: PrivateKeyType): Promise<string> {
        if (keyType === PrivateKeyType.P256) {
            const { privateKey } = await this.generateKeyPairPromise("ec", {
                namedCurve: "P-256",
                publicKeyEncoding: {
                    type: "spki",
                    format: "pem",
                },
                privateKeyEncoding: {
                    type: "pkcs8",
                    format: "pem",
                    cipher: "aes-256-cbc",
                    passphrase: passphrase,
                },
            });
            return privateKey;
        }

        const { privateKey } = await this.generateKeyPairPromise(PrivateKeyType.ED25519, {
            publicKeyEncoding: {
                type: "spki",
                format: "pem",
            },
            privateKeyEncoding: {
                type: "pkcs8",
                format: "pem",
                cipher: "aes-256-cbc",
                passphrase: passphrase,
            },
        });
        return privateKey;
    }
}