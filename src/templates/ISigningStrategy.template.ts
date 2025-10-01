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

import { KeyObject } from 'crypto';

interface ISigningStrategy {
    /**
     * Creates a digital signature for the given data.
     * @param data The raw data (as a byte array) to be signed.
     * @returns A Promise that resolves to the signature (as a byte array).
     */
    sign(data: Uint8Array): Promise<Uint8Array>;

    /**
     * Retrieves the public key that corresponds to the private key used for signing.
     * @returns A Promise that resolves to the public key.
     */
    getPublicKey(): Promise<KeyObject>;
}

export class YourCustomSigningStrategy implements ISigningStrategy {
    /**
     * Implement your custom signing logic here. This is where you might call
     * an external API, interact with a hardware device, or use another
     * cryptography library.
     */
    async sign(data: Uint8Array): Promise<Uint8Array> {
        // TODO: Replace this placeholder with your actual signing logic.
        return Promise.reject(new Error('sign is not implemented.'));
    }

    /**
     * Implement the logic to retrieve your public key. It must correspond
     * to the private key used in the sign() method above.
     */
    async getPublicKey(): Promise<KeyObject> {
        // TODO: Replace this placeholder with your public key retrieval logic.
        return Promise.reject(new Error('getPublicKey is not implemented.'));
    }
}

// 1. A basic implementation using Node's built-in crypto library:
//    https://github.com/WICG/webpackage/blob/main/js/sign/src/signers/node-crypto-signing-strategy.ts
//
// 2. An implementation using Google Cloud's Key Management Service:
//    https://github.com/chromeos/wbn-sign-gcp-kms/blob/main/src/wbn-sign-gcp-kms.ts
