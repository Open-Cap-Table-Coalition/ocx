import { describe, expect, test, jest } from "@jest/globals";

import OCX from "src";

describe("OCX.Logger", () => {
  test("writes to console by default", () => {
    const spy = spyOnConsole("info");
    OCX.Logger.info("message");
    expect(spy).toHaveBeenCalledWith("message");
  });

  test("suppresses debug by default", () => {
    const spy = spyOnConsole("debug");
    OCX.Logger.debug("message");
    expect(spy).not.toHaveBeenCalled();
  });

  test("allows debug to be enabled", () => {
    const spy = spyOnConsole("debug");
    OCX.Logger.enableDebug();
    OCX.Logger.debug("message");
    expect(spy).toHaveBeenCalledWith("[DEBUG] message");
  });

  test("logs errors", () => {
    const spy = spyOnConsole("error");
    OCX.Logger.error("oh no");
    expect(spy).toHaveBeenCalledWith("[ERROR] oh no");
  });

  test("allows implementation to be replaced", () => {
    const mockLogger = {
      debug: jest.fn<typeof console.debug>(),
      info: jest.fn<typeof console.info>(),
      warn: jest.fn<typeof console.warn>(),
      error: jest.fn<typeof console.debug>(),
    };
    const actualConsole = spyOnConsole("warn");

    OCX.Logger.logUsing(mockLogger);
    OCX.Logger.warn("^_^");
    expect(mockLogger.warn).toHaveBeenCalledWith("[ WARN] ^_^");
    expect(actualConsole).not.toHaveBeenCalled();
  });

  function spyOnConsole(method: "debug" | "info" | "warn" | "error") {
    const preventActualConsoleWrite = () => {
      /* no-op */
    };
    return jest
      .spyOn(global.console, method)
      .mockImplementation(preventActualConsoleWrite);
  }
});
