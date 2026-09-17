import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProductReveal } from "../../src/ui/productReveal/ProductReveal";
import { clamp01, revealPose } from "../../src/ui/productReveal/revealSequence";
import fit from "../../docs/evidence/product-reveal/packaging-fit.json";
import measured from "../../docs/evidence/phase3-product-depth/human-balance-asset-report.json";

const renderer = vi.hoisted(() => ({create:vi.fn(),go:vi.fn(),dispose:vi.fn(),settled:()=>{}}));
vi.mock("../../src/ui/productReveal/revealRenderer",()=>({createRevealRenderer:renderer.create}));
beforeEach(()=> {
  renderer.create.mockReset();renderer.go.mockReset();renderer.dispose.mockReset();
  renderer.create.mockImplementation(async (_host:HTMLElement,settled:()=>void)=>{
    renderer.settled=settled; return {go:renderer.go,dispose:renderer.dispose};
  });
});
afterEach(()=>vi.useRealTimers());

describe("separate product reveal",()=> {
  it("presents the ordered journey without issuing any game command or writing storage", async()=> {
    const storage=vi.spyOn(Storage.prototype,"setItem");
    const {unmount}=render(<ProductReveal/>);
    const discover=await screen.findByRole("button",{name:/Meet the Human Balance/});
    expect(screen.getByText("Physical companion to the online experience")).toBeVisible();
    expect(screen.queryByText(/Concept preview/)).not.toBeInTheDocument();
    fireEvent.click(discover);
    expect(renderer.go).toHaveBeenLastCalledWith(1);
    expect(screen.getByText("Open the box").closest("button")).toBeDisabled();
    expect(screen.getByText("Physical companion to the online experience")).not.toBeVisible();
    expect(screen.getByText("Your choices, packed into one object.")).not.toBeVisible();
    act(()=>renderer.settled());
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button",{name:/Open the box/}));
    expect(renderer.go).toHaveBeenLastCalledWith(2);
    expect(screen.getByText(/Inside: the foldable/)).not.toBeVisible();
    act(()=>renderer.settled());
    // A genuine product-only hold after movement ends, not a new journey phase.
    act(()=>vi.advanceTimersByTime(1499));
    expect(screen.getByText(/Inside: the foldable/)).not.toBeVisible();
    expect(screen.getByText("Physical companion to the online experience")).not.toBeVisible();
    expect(screen.queryByRole("button",{name:/Unfold the Human Balance/})).not.toBeInTheDocument();
    act(()=>vi.advanceTimersByTime(1));
    expect(screen.getByText(/Inside: the foldable/)).toBeVisible();
    vi.useRealTimers();
    fireEvent.click(screen.getByRole("button",{name:/Unfold the Human Balance/}));
    expect(renderer.go).toHaveBeenLastCalledWith(3);
    expect(screen.queryByRole("link",{name:/Enter the game/})).not.toBeInTheDocument();
    act(()=>renderer.settled());
    expect(screen.getByRole("link",{name:/Enter the game/})).toHaveAttribute("href","/play");
    expect(storage).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button",{name:"Replay reveal"}));
    expect(renderer.go).toHaveBeenLastCalledWith(0);
    unmount();expect(renderer.dispose).toHaveBeenCalledTimes(1);storage.mockRestore();
  });
  it("reports a loading failure visibly and offers no fake 3D substitute",async()=> {
    renderer.create.mockRejectedValueOnce(new Error("WebGL unavailable"));
    render(<ProductReveal/>);
    expect(await screen.findByRole("alert")).toHaveTextContent("could not load");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
  it("disposes a renderer that finishes loading after navigation away",async()=> {
    let resolve!:(value:unknown)=>void;
    renderer.create.mockImplementationOnce(()=>new Promise(r=>{resolve=r;}));
    const view=render(<ProductReveal/>);
    await waitFor(()=>expect(renderer.create).toHaveBeenCalled());view.unmount();
    await act(async()=>resolve({go:renderer.go,dispose:renderer.dispose}));
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
  });
});

describe("physical presentation constraints",()=> {
  it("clamps a queued frame timestamp from before the click to the start pose",()=> {
    expect(clamp01(-.001)).toBe(0);
    expect(clamp01(1.2)).toBe(1);
  });
  it("lifts the lid before moving it aside",()=> {
    expect(revealPose(1.3).lidAway).toBe(0);
    expect(revealPose(1.56).lidLift).toBeCloseTo(2);
  });
  it("clears the walls before unfolding, then deals markers in order",()=> {
    expect(revealPose(2.34).boardLift).toBe(1);
    expect(revealPose(2.34).boardUnfold).toBe(0);
    expect(revealPose(2.75).boardUnfold).toBe(1);
    expect(revealPose(2.75).markers).toEqual([0,0,0,0,0]);
    const markers=revealPose(2.9).markers;
    expect(markers[0]).toBeGreaterThan(markers[4]);
    expect(revealPose(3).markers).toEqual([1,1,1,1,1]);
  });
  it("fits the measured folded asset and five independent marker pockets",()=> {
    const size=measured.foldingVerification.closedBlenderBounds.dimensions;
    expect(fit.foldedBalanceMm[0]).toBeCloseTo(size[2]*40,2);
    expect(fit.foldedBalanceMm[1]).toBeCloseTo(size[1]*40,2);
    expect(fit.foldedBalanceMm[2]).toBeCloseTo(size[0]*40,2);
    fit.foldedBalanceMm.forEach((dimension,i)=>expect(dimension).toBeLessThan(fit.cavityMm[i]));
    expect(fit.markerCentersBlender).toHaveLength(5);
    expect(fit.pocketDiameterMm).toBeGreaterThan(fit.markerDiameterMm);
    expect(fit.foldedBoundsBlender[0][1]).toBeGreaterThan(fit.markerCentersBlender[0][1]+.22);
    expect(fit.topClearanceMm).toBeGreaterThan(0);
  });
});
