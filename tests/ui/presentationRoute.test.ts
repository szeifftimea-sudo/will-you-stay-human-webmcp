import { describe, expect, it } from "vitest";
import { presentationRoute } from "../../src/app/presentationRoute";

describe("public presentation routes", () => {
  it.each([
    ["/play", "", "spatial"],
    ["/play/", "", "spatial"],
    ["/product", "", "product"],
    ["/product/", "", "product"],
    ["/", "?tabletop=cards", "spatial"],
    ["/", "?product=reveal", "product"],
    ["/", "?tabletop=1", "prototype"],
    ["/", "", "original"],
  ])("resolves %s%s without changing the original entry", (path, search, expected) => {
    expect(presentationRoute(path, search)).toBe(expected);
  });
});
