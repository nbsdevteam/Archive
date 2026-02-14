import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { renderHook, type RenderHookOptions } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AppProviders } from "../../app/providers/AppProviders";

export interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  /** Initial URL path (e.g. "/folders/123" for useParams). */
  initialEntries?: string[];
  /** Route path with params (e.g. "/folders/:id"). If set, children are rendered as route element. */
  routePath?: string;
}

/**
 * Wraps component with MemoryRouter and AppProviders for integration-style tests.
 * Use initialEntries + routePath when testing components/hooks that rely on useParams().
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    initialEntries = ["/"],
    routePath,
    ...renderOptions
  }: RenderWithProvidersOptions = {}
) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries} initialIndex={0}>
      <AppProviders>
        {routePath ? (
          <Routes>
            <Route path={routePath} element={children} />
          </Routes>
        ) : (
          children
        )}
      </AppProviders>
    </MemoryRouter>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

export interface RenderHookWithProvidersOptions<TProps> extends RenderHookOptions<TProps> {
  initialEntries?: string[];
  routePath?: string;
}

/**
 * Wraps renderHook with MemoryRouter + AppProviders. Use initialEntries/routePath for hooks that use useParams().
 */
export function renderHookWithProviders<Result, Props>(
  hook: (props: Props) => Result,
  options: RenderHookWithProvidersOptions<Props> = {}
) {
  const { initialEntries = ["/"], routePath, ...renderOptions } = options;

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries} initialIndex={0}>
      <AppProviders>
        {routePath ? (
          <Routes>
            <Route path={routePath} element={children} />
          </Routes>
        ) : (
          children
        )}
      </AppProviders>
    </MemoryRouter>
  );

  return renderHook(hook, { wrapper: Wrapper, ...renderOptions });
}
