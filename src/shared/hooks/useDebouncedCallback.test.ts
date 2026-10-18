import { act, renderHook } from '@testing-library/react';
import { useDebouncedCallback } from './useDebouncedCallback';

describe('useDebouncedCallback', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function setup() {
    const callback = vi.fn();
    const hook = renderHook(() => useDebouncedCallback(callback, { delay: 300, maxWait: 800 }));
    return { callback, hook };
  }

  it('calls once with the latest arguments after the delay', () => {
    const { callback, hook } = setup();
    hook.result.current('a');
    hook.result.current('ab');
    vi.advanceTimersByTime(299);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledExactlyOnceWith('ab');
  });

  it('never waits longer than maxWait while calls keep coming', () => {
    const { callback, hook } = setup();
    for (let t = 0; t < 800; t += 100) {
      hook.result.current(`v${t}`);
      vi.advanceTimersByTime(100);
    }
    expect(callback).toHaveBeenCalledExactlyOnceWith('v700');
  });

  it('flushes the pending call when the page is hidden', () => {
    const { callback, hook } = setup();
    hook.result.current('draft');
    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });
    expect(callback).toHaveBeenCalledExactlyOnceWith('draft');
  });

  it('flushes the pending call on unmount', () => {
    const { callback, hook } = setup();
    hook.result.current('draft');
    hook.unmount();
    expect(callback).toHaveBeenCalledExactlyOnceWith('draft');
  });
});
