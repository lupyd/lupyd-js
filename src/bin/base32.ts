// https://github.com/devbanana/crockford-base32/blob/develop/src/index.ts
// https://github.com/devbanana/crockford-base32/blob/develop/LICENSE

// noinspection SpellCheckingInspection
const characters = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

type DecodeAsNumberOptions = { asNumber: true };
type DecodeAsBufferOptions = { asNumber: false };

/**
 * An implementation of the Crockford Base32 algorithm.
 *
 * Spec: https://www.crockford.com/base32.html
 */
export class CrockfordBase32 {
  static encode(input: Uint8Array | number | bigint): string {
    if (typeof input === "bigint" || typeof input === "number") {
      input = this.createBuffer(input);
    }
    const output: number[] = [];
    let bitsRead = 0;
    let buffer = 0;

    for (const byte of input) {
      // Add current byte to start of buffer
      buffer = (buffer << 8) | byte;
      bitsRead += 8;

      while (bitsRead >= 5) {
        output.push((buffer >>> (bitsRead - 5)) & 0x1f);
        bitsRead -= 5;
      }
    }

    if (bitsRead > 0) {
      output.push((buffer << (5 - bitsRead)) & 0x1f);
    }

    return output.map((byte) => characters.charAt(byte)).join("");
  }

  static decode(input: string, options: DecodeAsNumberOptions): bigint;
  static decode(input: string, options?: DecodeAsBufferOptions): Uint8Array;
  static decode(
    input: string,
    options?: DecodeAsNumberOptions | DecodeAsBufferOptions,
  ): bigint | Uint8Array {
    // 1. Translate input to all uppercase
    // 2. Translate I, L, and O to valid base 32 characters
    // 3. Remove all hyphens
    input = input
      .toUpperCase()
      .replace(/O/g, "0")
      .replace(/[IL]/g, "1")
      .replace(/-+/g, "");

    const output: number[] = [];
    let bitsRead = 0;
    let buffer = 0;

    for (const character of input) {
      const byte = characters.indexOf(character);
      if (byte === -1) {
        throw new Error(
          `Invalid base 32 character found in string: ${character}`,
        );
      }

      bitsRead += 5;

      if (bitsRead >= 8) {
        bitsRead -= 8;
        output.push(buffer | (byte >> bitsRead));
        buffer = (byte << (8 - bitsRead)) & 0xff;
      } else {
        buffer |= byte << (8 - bitsRead);
      }
    }

    if (buffer > 0) {
      output.push(buffer);
    }

    if (options?.asNumber === true) {
      return this.asNumber(output);
    }

    return this.asBuffer(output);
  }

  private static createBuffer(input: number | bigint): Uint8Array {
    if (typeof input === "number") {
      input = BigInt(input);
    }

    if (input < 0n) {
      throw new Error("Input cannot be a negative number");
    }

    const buffer = new Uint8Array(8);
    new DataView(buffer.buffer).setBigUint64(0, input, false);

    return buffer;
  }

  private static asNumber(output: number[]): bigint {
    let outputNumber = 0n;

    output.forEach((byte) => {
      outputNumber <<= 8n;
      outputNumber |= BigInt(byte);
    });

    return outputNumber;
  }

  private static asBuffer(output: number[]): Uint8Array {
    return new Uint8Array(output);
  }
}
