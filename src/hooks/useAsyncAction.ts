import { useCallback, useState } from "react";
import { toast } from "sonner";

interface UseAsyncActionOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string | ((err: Error) => string);
  showErrorToast?: boolean;
}

export function useAsyncAction<T, Args extends unknown[]>(
  action: (...args: Args) => Promise<T>,
  options: UseAsyncActionOptions<T> = {},
) {
  const {
    onSuccess,
    onError,
    loadingMessage,
    successMessage,
    errorMessage,
    showErrorToast = true,
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (...args: Args) => {
      setIsLoading(true);
      setError(null);

      const toastId = loadingMessage
        ? toast.loading(loadingMessage)
        : undefined;

      try {
        const result = await action(...args);
        if (successMessage) {
          toast.success(successMessage, toastId ? { id: toastId } : undefined);
        }
        onSuccess?.(result);
        return result;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        if (showErrorToast) {
          const msg =
            typeof errorMessage === "function"
              ? errorMessage(err)
              : errorMessage || err.message || "操作失败";
          toast.error(msg, toastId ? { id: toastId } : undefined);
        }
        onError?.(err);
        return undefined;
      } finally {
        setIsLoading(false);
      }
    },
    [
      action,
      errorMessage,
      loadingMessage,
      onError,
      onSuccess,
      showErrorToast,
      successMessage,
    ],
  );

  return { execute, isLoading, error };
}
