import { decode } from "https://deno.land/std@v0.57.0/encoding/base64.ts";
import { concat } from "./util.ts";

type Reader = Deno.Reader;

export function base64Decoder(reader: Reader): Reader {
  let extra: Uint8Array | null;
  const buffer = new Deno.Buffer();
  const decoder = new TextDecoder();
  const b = new Uint8Array(32 * 1024);

  return {
    async read(p: Uint8Array): Promise<number | null> {
      if (buffer.empty()) {
        const n = await reader.read(b);

        if (n === null) {
          return null;
        }

        let chunk = b.subarray(0, n);
        chunk = extra ? concat(extra, chunk) : chunk;

        // 4 characters represent 3 bytes
        const remaining = chunk.length % 4;

        if (remaining !== 0) {
          extra = chunk.slice(chunk.length - remaining);
          chunk = chunk.subarray(0, chunk.length - remaining);
        } else {
          extra = null;
        }

        if (chunk.length === 0) {
          return 0;
        }

        await Deno.writeAll(
          buffer,
          new Uint8Array(decode(decoder.decode(chunk))),
        );
      }

      return buffer.read(p);
    },
  };
}
