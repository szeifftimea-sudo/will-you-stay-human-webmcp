import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { LandingCity } from "../../src/ui/landing/LandingCity";
import { App } from "../../src/app/App";
import { createAppServices } from "../../src/app/bootstrap";
import { MemoryGameRepository } from "../../src/infrastructure/storage/gameRepository";
import { landingIntro } from "../../src/ui/landing/landingIntro";

const mock=vi.hoisted(()=>({create:vi.fn(),dispose:vi.fn()}));
vi.mock("../../src/ui/landing/landingCityRenderer",()=>({createLandingCity:mock.create}));
beforeEach(()=>{
  mock.create.mockReset();mock.dispose.mockReset();
  mock.create.mockImplementation(async (_host, ready) => { ready?.(); return {dispose:mock.dispose}; });
  vi.stubGlobal("WebGLRenderingContext",class {});
});
afterEach(()=>vi.unstubAllGlobals());

describe("decorative Blender landing",()=>{
  it("does not load the landing city when resuming an existing journey",()=>{
    render(<LandingCity active={false}/>);
    expect(screen.queryByTestId("landing-city")).not.toBeInTheDocument();
    expect(mock.create).not.toHaveBeenCalled();
  });
  it("shows the city, fades in only the isolated human, then enables entry",()=>{
    expect(landingIntro(0,false)).toEqual({humanOpacity:0,copyStage:0,entryReady:false});
    expect(landingIntro(2999,false).humanOpacity).toBe(0);
    expect(landingIntro(4000,false)).toEqual({humanOpacity:.36,copyStage:0,entryReady:false});
    expect(landingIntro(5000,false)).toEqual({humanOpacity:.72,copyStage:1,entryReady:false});
    expect(landingIntro(5400,false).copyStage).toBe(2);
    expect(landingIntro(6100,false).copyStage).toBe(3);
    expect(landingIntro(7000,false)).toEqual({humanOpacity:.72,copyStage:4,entryReady:false});
    expect(landingIntro(7700,false)).toEqual({humanOpacity:.72,copyStage:4,entryReady:true});
    expect(landingIntro(0,true)).toEqual({humanOpacity:.72,copyStage:4,entryReady:true});
  });
  it("keeps the HTML entry inert until the renderer finishes the presentation",async()=>{
    let reveal!:()=>void;
    mock.create.mockImplementation(async (_host,ready)=>{reveal=ready;return {dispose:mock.dispose};});
    localStorage.clear();
    const services=createAppServices(new MemoryGameRepository());
    const view=render(<App services={services}/>);
    await waitFor(()=>expect(mock.create).toHaveBeenCalled());
    expect(view.container.querySelector('.entry-copy')).toHaveAttribute('inert');
    expect(services.engine.getSnapshot()).toBeNull();
    act(()=>reveal());
    expect(view.container.querySelector('.entry-copy')).not.toHaveAttribute('inert');
    expect(services.engine.getSnapshot()).toBeNull();
  });
  it("is hidden from assistive technology and releases its renderer on exit",async()=>{
    const view=render(<LandingCity/>);
    await waitFor(()=>expect(screen.getByTestId("landing-city")).toHaveAttribute("data-ready","true"));
    expect(screen.getByTestId("landing-city")).toHaveAttribute("aria-hidden","true");
    expect(screen.queryByRole("button")).toBeNull();
    view.unmount();expect(mock.dispose).toHaveBeenCalledOnce();
  });
  it("keeps the illustrated fallback if WebGL or the GLB fails",async()=>{
    mock.create.mockRejectedValueOnce(new Error("Unavailable"));
    render(<LandingCity/>);
    await waitFor(()=>expect(screen.getByTestId("landing-city")).toHaveAttribute("data-ready","fallback"));
  });
  it("disposes an asset that finishes after navigation",async()=>{
    let resolve!:(value:unknown)=>void;
    mock.create.mockImplementationOnce(()=>new Promise(r=>{resolve=r;}));
    const view=render(<LandingCity/>);await waitFor(()=>expect(mock.create).toHaveBeenCalled());view.unmount();
    await act(async()=>resolve({dispose:mock.dispose}));expect(mock.dispose).toHaveBeenCalledOnce();
  });
  it("never enters or chooses automatically; the existing CTA enters, then removes the city",async()=>{
    localStorage.clear();
    const services=createAppServices(new MemoryGameRepository());
    render(<App services={services}/>);
    await waitFor(()=>expect(screen.getByTestId("landing-city")).toHaveAttribute("data-ready","true"));
    expect(services.engine.getSnapshot()).toBeNull();
    expect(screen.queryByTestId("human-balance")).not.toBeInTheDocument();
    expect(screen.queryByText("Should I apologize for you?")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button",{name:"Enter Machine City"}));
    expect(screen.getByTestId("game-phase")).toHaveTextContent("MACHINE_CITY_READY");
    expect(screen.getByTestId("landing-city")).toHaveAttribute("data-active","false");
    await waitFor(()=>expect(screen.queryByTestId("landing-city")).not.toBeInTheDocument(),{timeout:1500});
    expect(mock.dispose).toHaveBeenCalledOnce();
    expect(services.engine.getSnapshot()?.tentativeSelection).toBeNull();
  });
});
