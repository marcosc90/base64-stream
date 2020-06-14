import { encode } from "https://deno.land/std@v0.57.0/encoding/base64.ts";
import { concat } from "./util.ts";

type Reader = Deno.Reader;

export function base64Encoder(reader: Reader): Reader {
  let extra: Uint8Array | null;
  const buffer = new Deno.Buffer();
  const b = new Uint8Array(32 * 1024);
  const encoder = new TextEncoder();

  const _read = async (
    chunk: Uint8Array,
    p: Uint8Array,
  ): Promise<number | null> => {
    await Deno.writeAll(buffer, encoder.encode(encode(chunk)));
    return buffer.read(p);
  };

  return {
    async read(p: Uint8Array): Promise<number | null> {
      if (!buffer.empty()) {
        return buffer.read(p);
      }

      const n = await reader.read(b);
      if (n === null) {
        if (extra) {
          // Flush remaining
          const chunk = extra;
          extra = null;
          return _read(chunk, p);
        }

        return null;
      }

      let chunk = b.subarray(0, n);

      if (extra) {
        chunk = concat(extra, chunk);
        extra = null;
      }

      // 3 bytes are represented by 4 characters
      const remaining = chunk.length % 3;
      if (remaining !== 0) {
        // buffer remaining bytes
        extra = chunk.slice(chunk.length - remaining);
        chunk = chunk.subarray(0, chunk.length - remaining);
      }

      if (chunk.length === 0) {
        return 0;
      }

      return _read(chunk, p);
    },
  };
}
