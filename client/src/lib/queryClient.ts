import { QueryClient, QueryFunction } from "@tanstack/react-query";

export interface ApiError extends Error {
  status: number;
  code?: string;
  packSuggested?: "overlimit_200" | "plus_600";
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    let parsed: { error?: string; code?: string; packSuggested?: string } | null = null;
    try {
      parsed = JSON.parse(text);
    } catch {}
    
    const error = new Error(parsed?.error || text || res.statusText) as ApiError;
    error.status = res.status;
    error.code = parsed?.code;
    error.packSuggested = parsed?.packSuggested as "overlimit_200" | "plus_600" | undefined;
    throw error;
  }
}

export function isProcessingPackError(error: unknown): error is ApiError {
  return (
    error instanceof Error && 
    "code" in error && 
    (error as ApiError).code === "NEEDS_PROCESSING_PACK"
  );
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

// Build URL from queryKey - filter out non-string parts (like objects used for cache keys)
function buildUrlFromQueryKey(queryKey: readonly unknown[]): string {
  const pathParts = queryKey.filter((part): part is string => typeof part === "string");
  return pathParts.join("/");
}

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = buildUrlFromQueryKey(queryKey);
    console.log("[queryFn]", url);
    
    const res = await fetch(url, {
      credentials: "include",
    });

    console.log("[queryFn]", url, "status", res.status);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
