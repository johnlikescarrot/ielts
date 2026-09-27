import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { VideoStudyView } from "../../src/components/video/VideoStudyView";
import { I18nProvider } from "../../src/i18n/i18nContext";

const transcript =
  "Climate researchers analyse complex environmental systems. Their significant research can inform public policy. Renewable energy offers substantial benefits, although communities require careful planning. Scientists evaluate evidence and identify practical solutions. Governments should establish transparent policies because sustainable development affects future generations. Education can increase awareness and encourage meaningful participation. This approach may reduce pollution, improve public health, and create economic opportunities. However every community must adapt the strategy to local circumstances.";

describe("VideoStudyView", () => {
  it("validates input and generates an offline lesson", async () => {
    render(
      <I18nProvider>
        <VideoStudyView />
      </I18nProvider>,
    );
    expect(
      screen.getByRole("heading", { name: "Video-to-IELTS Studio" }),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Create my lesson" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent("at least 40 words");
    await userEvent.type(
      screen.getByPlaceholderText(/future of renewable energy/i),
      "Climate action",
    );
    await userEvent.type(
      screen.getByPlaceholderText(/at least 40 words/i),
      transcript,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Create my lesson" }),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Generated video lesson")).toBeInTheDocument();
    expect(screen.getByText("Listening cloze")).toBeInTheDocument();
    expect(screen.getByText("Speaking Part 3")).toBeInTheDocument();
  });
});
