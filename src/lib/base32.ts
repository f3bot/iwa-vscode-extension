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

const BASE32_ALPHABET = "abcdefghijklmnopqrstuvwxyz234567";

type BinaryData = ArrayBufferView | ArrayBuffer;

function toDataView(data: BinaryData): DataView {
    if (data instanceof ArrayBuffer) {
        return new DataView(data);
    }
    if (ArrayBuffer.isView(data)) {
        return new DataView(data.buffer, data.byteOffset, data.byteLength);
    }
    throw new Error("Unsupported data type. Expected ArrayBuffer or ArrayBufferView.");
}

export function base32Encode(data: BinaryData): string {
    const view = toDataView(data);

    let bits = 0;
    let value = 0;
    let output = "";

    for (let i = 0; i < view.byteLength; i++) {
        value = (value << 8) | view.getUint8(i);
        bits += 8;

        while (bits >= 5) {
            const index = (value >>> (bits - 5)) & 31;
            output += BASE32_ALPHABET[index];
            bits -= 5;
        }
    }

    if (bits > 0) {
        const index = (value << (5 - bits)) & 31;
        output += BASE32_ALPHABET[index];
    }

    return output;
}
