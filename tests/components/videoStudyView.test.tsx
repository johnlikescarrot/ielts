import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nProvider } from "../../src/i18n/i18nContext";
import { VideoStudyView } from "../../src/components/video/VideoStudyView";
import { storageService } from "../../src/storage/storageService";

describe("VideoStudyView", () => {
  beforeEach(async () => {
    localStorage.clear();
    await storageService.resetAll();
    delete (globalThis as any).browser;
  });

  it("explains the local workflow before the learner has saved a clip", async () => {
    render(
      <I18nProvider>
        <VideoStudyView />
      </I18nProvider>,
    );

    expect(
      await screen.findByText("Your clip library is ready"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Video and audio never leave your browser/i),
    ).toBeInTheDocument();
  });

  it("opens and removes saved clips from the Firefox-local library", async () => {
    const createTab = vi.fn();
    (globalThis as any).browser = { tabs: { create: createTab } };
    await storageService.addVideoClip({
      provider: "youtube",
      sourceUrl: "https://www.youtube.com/watch?v=alpha",
      sourceTitle: "Pronunciation practice",
      startSeconds: 61,
      endSeconds: 76,
    });
    await storageService.addVideoClip({
      provider: "bilibili",
      sourceUrl: "https://www.bilibili.com/video/BV1xx",
      sourceTitle: "Listening practice",
      startSeconds: 5,
      endSeconds: 15,
    });

    render(
      <I18nProvider>
        <VideoStudyView />
      </I18nProvider>,
    );

    expect(
      await screen.findByText("Pronunciation practice"),
    ).toBeInTheDocument();
    expect(screen.getByText("Listening practice")).toBeInTheDocument();
    expect(screen.getByText("1:01 – 1:16")).toBeInTheDocument();

    await userEvent.click(
      screen.getAllByRole("button", { name: "Open at timestamp" })[1],
    );
    expect(createTab).toHaveBeenCalledWith({
      url: "https://www.youtube.com/watch?v=alpha&t=61",
    });

    await userEvent.click(
      screen.getAllByRole("button", { name: "Remove clip" })[1],
    );
    await waitFor(() =>
      expect(
        screen.queryByText("Pronunciation practice"),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getAllByRole("button", { name: "Remove clip" })).toHaveLength(
      1,
    );
  });

  it("uses a standard new tab when the view is rendered outside Firefox", async () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    await storageService.addVideoClip({
      provider: "youtube",
      sourceUrl: "https://youtu.be/alpha",
      sourceTitle: "Fallback opening",
      startSeconds: 2,
      endSeconds: 12,
    });

    render(
      <I18nProvider>
        <VideoStudyView />
      </I18nProvider>,
    );

    await userEvent.click(
      await screen.findByRole("button", { name: "Open at timestamp" }),
    );
    expect(open).toHaveBeenCalledWith(
      "https://youtu.be/alpha?t=2",
      "_blank",
      "noopener",
    );
    open.mockRestore();
  });
});
