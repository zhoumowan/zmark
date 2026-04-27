/**
 * 包装 Promise 以返回 [error, data] 元组，消除 try-catch 嵌套
 * 灵感来源于 await-to-js
 * @example
 * const [err, data] = await to(fetchData());
 * if (err) return handleError(err);
 */
export async function to<T, U = Error>(
  promise: Promise<T>,
  errorExt?: object,
): Promise<[U, undefined] | [null, T]> {
  try {
    const data = await promise;
    return [null, data];
    // biome-ignore lint/suspicious/noExplicitAny: <Catch 子句类型必须为 any 或者 unknown>
  } catch (err: any) {
    if (errorExt) {
      Object.assign(err, errorExt);
    }
    return [err, undefined];
  }
}

/**
 * 包装同步函数以返回 [error, data] 元组
 */
export function toSync<T, U = Error>(
  fn: () => T,
  errorExt?: object,
): [U, undefined] | [null, T] {
  try {
    const data = fn();
    return [null, data];
    // biome-ignore lint/suspicious/noExplicitAny: <Catch 子句类型必须为 any 或者 unknown>
  } catch (err: any) {
    if (errorExt) {
      Object.assign(err, errorExt);
    }
    return [err, undefined];
  }
}

/**
 * 安全执行同步或异步函数，自动捕获错误并返回 [error, data] 元组
 */
export function safeExecute<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T> | T,
  onError?: (err: Error) => void,
) {
  return async (...args: Args): Promise<[Error, undefined] | [null, T]> => {
    try {
      const result = await fn(...args);
      return [null, result];
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      if (onError) onError(error);
      return [error, undefined];
    }
  };
}
