import { formatBytes, formatNumber, formatDate, formatDateTime } from "../api";

describe("formatBytes", () => {
  it("formats bytes correctly", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(500)).toBe("500 B");
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(1048576)).toBe("1.0 MB");
    expect(formatBytes(1073741824)).toBe("1.0 GB");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(2621440)).toBe("2.5 MB");
  });
});

describe("formatNumber", () => {
  it("formats numbers with locale formatting", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(100)).toBe("100");
    expect(formatNumber(1000)).toBe("1,000");
    expect(formatNumber(1000000)).toBe("1,000,000");
  });
});

describe("formatDate", () => {
  it("formats dates correctly", () => {
    const date = "2024-01-15T10:30:00Z";
    const formatted = formatDate(date);
    expect(formatted).toMatch(/Jan/);
    expect(formatted).toMatch(/15/);
    expect(formatted).toMatch(/2024/);
  });
});

describe("formatDateTime", () => {
  it("formats date and time correctly", () => {
    const date = "2024-01-15T10:30:00Z";
    const formatted = formatDateTime(date);
    expect(formatted).toMatch(/Jan/);
    expect(formatted).toMatch(/15/);
    expect(formatted).toMatch(/2024/);
    expect(formatted).toMatch(/\d{1,2}:\d{2}/);
  });
});
