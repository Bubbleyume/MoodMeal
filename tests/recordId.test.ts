import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import {createRecordId} from "../src/lib/recordId";
const original = Object.getOwnPropertyDescriptor(globalThis, "crypto");
try {
  for (const crypto of [webcrypto, {getRandomValues: webcrypto.getRandomValues.bind(webcrypto)}, undefined]) {
    Object.defineProperty(globalThis, "crypto", {configurable: true, value: crypto});
    const ids = Array.from({length: 1000}, () => createRecordId());
    assert.ok(ids.every(id => typeof id === "string" && id.length > 0));
    assert.equal(new Set(ids).size, ids.length);
    assert.deepEqual(JSON.parse(JSON.stringify(ids)), ids);
  }
  console.log("Record IDs pass with HTTPS crypto, HTTP crypto, and no crypto.");
} finally {
  if (original) Object.defineProperty(globalThis, "crypto", original);
  else Reflect.deleteProperty(globalThis, "crypto");
}
