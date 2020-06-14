// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "https://deno.land/x/std@v0.57.0/testing/asserts.ts";
import { encode } from "https://deno.land/std@v0.57.0/encoding/base64.ts";
import { base64Encoder, base64Decoder } from "../mod.ts";

const testsetString = [
  ["", ""],
  ["f", "Zg=="],
  ["fo", "Zm8="],
  ["foo", "Zm9v"],
  ["foob", "Zm9vYg=="],
  ["fooba", "Zm9vYmE="],
  ["foobar", "Zm9vYmFy"],
  ["deno\n", "ZGVubwo="],
  ["deno\nland\n", "ZGVubwpsYW5kCg=="],
];

const stringCharReader = (string: string): Deno.Reader => {
  const encoder = new TextEncoder();
  const chars = Array.from(string);

  return {
    async read(p: Uint8Array): Promise<number | null> {
      const char = chars.shift();
      if (char === undefined) {
        return null;
      }

      const b = new Uint8Array([char.charCodeAt(0)]);

      p.set(b, 0);

      return b.length;
    },
  };
};

Deno.test("base64Encoder", async () => {
  for (const [input, output] of testsetString) {
    const reader = stringCharReader(input);

    const result = await Deno.readAll(base64Encoder(reader));
    assertEquals(new TextDecoder().decode(result), output);
  }
});

Deno.test("base64Decoder", async () => {
  for (const [input, output] of testsetString) {
    const reader = stringCharReader(output);

    const result = await Deno.readAll(base64Decoder(reader));
    assertEquals(new TextDecoder().decode(result), input);
  }
});

Deno.test("base64 file", async () => {
  const filePath = "./tests/1x1.png";
  let file = await Deno.open(filePath, { read: true });
  // Encode file
  const result = await Deno.readAll(base64Encoder(file));
  file.close();

  assertEquals(
    encode(await Deno.readFile(filePath)),
    new TextDecoder().decode(result),
  );

  file = await Deno.open(filePath, { read: true });
  const decoderReader = base64Decoder(base64Encoder(file));

  assertEquals(
    await Deno.readFile(filePath),
    await Deno.readAll(decoderReader),
  );
  file.close();
});
