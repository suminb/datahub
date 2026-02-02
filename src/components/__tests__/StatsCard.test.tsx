import { render, screen } from "@testing-library/react";
import StatsCard from "../StatsCard";

describe("StatsCard", () => {
  it("renders label and value", () => {
    render(<StatsCard label="Total Datasets" value={42} />);
    expect(screen.getByText("Total Datasets")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders with string value", () => {
    render(<StatsCard label="Status" value="Active" />);
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("applies default variant by default", () => {
    const { container } = render(<StatsCard label="Test" value={100} />);
    const valueElement = container.querySelector(".text-\\[--color-text-primary\\]");
    expect(valueElement).toBeInTheDocument();
  });

  it("applies accent variant correctly", () => {
    const { container } = render(<StatsCard label="Test" value={100} variant="accent" />);
    const valueElement = container.querySelector(".text-\\[--color-accent\\]");
    expect(valueElement).toBeInTheDocument();
  });

  it("applies success variant correctly", () => {
    const { container } = render(<StatsCard label="Test" value={100} variant="success" />);
    const valueElement = container.querySelector(".text-\\[--color-success\\]");
    expect(valueElement).toBeInTheDocument();
  });
});
