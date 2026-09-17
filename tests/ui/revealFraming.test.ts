import { describe, expect, it } from "vitest";
import { fitProductFrame } from "../../src/ui/productReveal/revealFraming";

describe("product reveal HTML-safe framing", () => {
  it.each([
    {left:47,top:167,right:743,bottom:384},
    {left:356,top:58,right:743,bottom:420},
    {left:67,top:210,right:1046,bottom:650},
  ])("keeps every projected edge inside the text-free region %j", safe => {
    const bounds={left:130,top:128,right:650,bottom:420};
    const fit=fitProductFrame(bounds,safe);
    expect(bounds.left*fit.scale+fit.x).toBeGreaterThanOrEqual(safe.left-1e-8);
    expect(bounds.right*fit.scale+fit.x).toBeLessThanOrEqual(safe.right+1e-8);
    expect(bounds.top*fit.scale+fit.y).toBeGreaterThanOrEqual(safe.top-1e-8);
    expect(bounds.bottom*fit.scale+fit.y).toBeLessThanOrEqual(safe.bottom+1e-8);
    expect(fit.scale).toBeLessThanOrEqual(1);
  });
});
