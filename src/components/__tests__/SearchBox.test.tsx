import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter, useSearchParams } from "next/navigation";
import SearchBox from "../SearchBox";

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

describe("SearchBox", () => {
  const mockPush = jest.fn();
  const mockSearchParams = new URLSearchParams();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
  });

  it("renders search input with default placeholder", () => {
    render(<SearchBox />);
    expect(screen.getByPlaceholderText("Search datasets...")).toBeInTheDocument();
  });

  it("renders search input with custom placeholder", () => {
    render(<SearchBox placeholder="Find something..." />);
    expect(screen.getByPlaceholderText("Find something...")).toBeInTheDocument();
  });

  it("updates input value on change", () => {
    render(<SearchBox />);
    const input = screen.getByPlaceholderText("Search datasets...");
    fireEvent.change(input, { target: { value: "test query" } });
    expect(input).toHaveValue("test query");
  });

  it("debounces search and updates URL with query", async () => {
    jest.useFakeTimers();
    render(<SearchBox />);
    const input = screen.getByPlaceholderText("Search datasets...");

    fireEvent.change(input, { target: { value: "test" } });

    // Should not call push immediately
    expect(mockPush).not.toHaveBeenCalled();

    // Fast-forward time
    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/?q=test");
    });

    jest.useRealTimers();
  });

  it("removes query param when search is cleared", async () => {
    jest.useFakeTimers();
    const paramsWithQuery = new URLSearchParams("q=existing");
    (useSearchParams as jest.Mock).mockReturnValue(paramsWithQuery);

    render(<SearchBox />);
    const input = screen.getByPlaceholderText("Search datasets...");

    fireEvent.change(input, { target: { value: "" } });

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/?");
    });

    jest.useRealTimers();
  });

  it("initializes with query from URL params", () => {
    const paramsWithQuery = new URLSearchParams("q=initial");
    (useSearchParams as jest.Mock).mockReturnValue(paramsWithQuery);

    render(<SearchBox />);
    const input = screen.getByPlaceholderText("Search datasets...");
    expect(input).toHaveValue("initial");
  });
});
