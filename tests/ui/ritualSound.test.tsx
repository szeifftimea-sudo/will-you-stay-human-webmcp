import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../../src/app/App";
import { createAppServices } from "../../src/app/bootstrap";
import { MemoryGameRepository } from "../../src/infrastructure/storage/gameRepository";
import type { RitualSoundPort } from "../../src/ui/audio/ritualSound";
import { UI_LOCALE_STORAGE_KEY } from "../../src/ui/presentationLocale";

function createSoundSpy(): RitualSoundPort {
  return {
    play: vi.fn(),
    setMuted: vi.fn(),
    dispose: vi.fn(),
  };
}

describe("minimális rituális hangréteg", () => {
  beforeEach(() => {
    localStorage.setItem(UI_LOCALE_STORAGE_KEY, "hu");
  });

  it("a vizuális eseményekhez kötött, nyelvfüggetlen hangjeleket kér", async () => {
    const services = createAppServices(new MemoryGameRepository());
    const sound = createSoundSpy();
    render(<App services={services} sound={sound} />);

    await waitFor(() => expect(screen.getByRole("button", { name: /Belépek a Gépvárosba/ })).toBeVisible());
    fireEvent.click(screen.getByRole("button", { name: /Belépek a Gépvárosba/ }));
    expect(sound.play).toHaveBeenLastCalledWith("futura-call");

    fireEvent.click(screen.getByRole("button", { name: /Mutasd a kérdést/ }));
    expect(sound.play).toHaveBeenLastCalledWith("futura-question");
    fireEvent.click(screen.getByRole("button", { name: /Megnézem a lehetőségeket/ }));
    fireEvent.click(screen.getByRole("button", { name: /Értem, jöhet az első kérdés/ }));
    expect(sound.play).toHaveBeenLastCalledWith("cards-dealt");

    fireEvent.click(screen.getByRole("button", { name: /^AGY/ }));
    expect(sound.play).toHaveBeenLastCalledWith("selection");
    fireEvent.click(screen.getByRole("button", { name: /Mutasd a másik oldalát/ }));
    expect(sound.play).toHaveBeenLastCalledWith("counterpoint");
    fireEvent.click(screen.getByRole("button", { name: "Maradok az AGY mellett" }));
    expect(sound.play).toHaveBeenLastCalledWith("retention");
    fireEvent.click(screen.getByRole("button", { name: /Vállalom ezt a döntést/ }));
    expect(sound.play).toHaveBeenLastCalledWith("confirmation");
    fireEvent.click(screen.getByRole("button", { name: /Megnézem, mivel jár/ }));
    expect(sound.play).toHaveBeenLastCalledWith("consequence");
    fireEvent.click(screen.getByRole("button", { name: "Megnézem az Embermérleget" }));
    expect(sound.play).toHaveBeenLastCalledWith("balance", {
      changedBalanceAxes: [0, 1, 2],
    });
  });

  it("a hangkapcsoló azonnal némít, majd külön visszakapcsolási jelet ad", async () => {
    const sound = createSoundSpy();
    render(<App services={createAppServices(new MemoryGameRepository())} sound={sound} />);

    const toggle = screen.getByRole("button", { name: "Hang némítása" });
    toggle.focus();
    expect(toggle).toHaveFocus();
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(toggle).toHaveAttribute("title", "Hang némítása");

    fireEvent.click(toggle);
    expect(sound.setMuted).toHaveBeenLastCalledWith(true);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(toggle).toHaveAccessibleName("Hang visszakapcsolása");
    expect(toggle).toHaveAttribute("title", "Hang visszakapcsolása");

    fireEvent.click(toggle);
    expect(sound.setMuted).toHaveBeenLastCalledWith(false);
    expect(sound.play).toHaveBeenLastCalledWith("unmute");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(toggle).toHaveAccessibleName("Hang némítása");
  });
});
