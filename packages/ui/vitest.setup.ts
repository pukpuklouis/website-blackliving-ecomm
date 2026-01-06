import '@testing-library/jest-dom/vitest';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!globalThis.ResizeObserver) {
  // @ts-expect-error test environment shim
  globalThis.ResizeObserver = ResizeObserverMock;
}
