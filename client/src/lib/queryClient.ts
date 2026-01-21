import { QueryClient, QueryFunction } from "@tanstack/react-query";

export interface ApiError extends Error {
  status: number;
  code?: string;
  packSuggested?: "overlimit_200" | "plus_600";
}

async function throwIfResNotOk(res: Response, redirectOn401 = true) {
  if (!res.ok) {
    // Handle 401 centrally - redirect to login
    if (res.status === 401 && redirectOn401) {
      console.log("[API 401] Session expired, redirecting to login");
      window.location.href = "/login?reason=session";
      throw new Error("SESSION_INVALID");
    }

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
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (res.status === 401) {
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      // For "throw" behavior, redirect to login
      console.log("[API 401]", queryKey.join("/"));
      window.location.href = "/login?reason=session";
      throw new Error("SESSION_INVALID");
    }

    await throwIfResNotOk(res, false); // Don't redirect again for 401
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
