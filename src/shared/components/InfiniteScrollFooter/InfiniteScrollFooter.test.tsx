import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InfiniteScrollFooter } from "./InfiniteScrollFooter";
import type { InfiniteListPaging } from "@/shared/hooks/useInfiniteList";

const makePaging = (overrides: Partial<InfiniteListPaging> = {}): InfiniteListPaging => ({
  hasNextPage: true,
  isFetchingNextPage: false,
  loadMoreFailed: false,
  fetchNextPage: vi.fn(),
  loadedCount: 20,
  total: 100,
  ...overrides,
});

let observers: { callback: IntersectionObserverCallback; disconnect: ReturnType<typeof vi.fn> }[];

function intersect() {
  act(() => {
    observers[observers.length - 1].callback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
  });
}

describe("InfiniteScrollFooter", () => {
  beforeEach(() => {
    observers = [];
    global.IntersectionObserver = vi.fn().mockImplementation((callback: IntersectionObserverCallback) => {
      const observer = { callback, observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() };
      observers.push(observer);
      return observer;
    }) as unknown as typeof IntersectionObserver;
  });

  it("loads the next page when scrolled near", () => {
    const paging = makePaging();
    render(<InfiniteScrollFooter paging={paging} />);

    intersect();

    expect(paging.fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it("observes again after a page loads, in case the footer is still in view", () => {
    const paging = makePaging();
    const { rerender } = render(<InfiniteScrollFooter paging={paging} />);
    const before = observers.length;

    rerender(<InfiniteScrollFooter paging={{ ...paging, loadedCount: 40 }} />);

    expect(observers.length).toBe(before + 1);
    expect(observers[before - 1].disconnect).toHaveBeenCalled();
  });

  it("does not auto-load while a page is already loading", () => {
    render(<InfiniteScrollFooter paging={makePaging({ isFetchingNextPage: true })} />);

    expect(observers).toHaveLength(0);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("does not auto-load in manual mode, but offers a button", async () => {
    const paging = makePaging();
    render(<InfiniteScrollFooter paging={paging} auto={false} />);

    expect(observers).toHaveLength(0);
    await userEvent.click(screen.getByRole("button"));

    expect(paging.fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it("stops auto-loading after a failure and offers a retry", async () => {
    const paging = makePaging({ loadMoreFailed: true });
    render(<InfiniteScrollFooter paging={paging} />);

    expect(observers).toHaveLength(0);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button"));

    expect(paging.fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it("has no load control once everything is loaded", () => {
    render(<InfiniteScrollFooter paging={makePaging({ hasNextPage: false, loadedCount: 100 })} />);

    expect(observers).toHaveLength(0);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders nothing for an empty list", () => {
    const { container } = render(
      <InfiniteScrollFooter paging={makePaging({ hasNextPage: false, loadedCount: 0, total: 0 })} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
