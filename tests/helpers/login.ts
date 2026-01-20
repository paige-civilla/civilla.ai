export interface LoginCredentials {
  email: string;
  password: string;
}

export async function login(baseUrl: string, credentials: LoginCredentials): Promise<string | null> {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    console.error("Login failed:", await response.text());
    return null;
  }

  const cookies = response.headers.get("set-cookie");
  return cookies;
}

export async function getAuthHeaders(baseUrl: string, credentials: LoginCredentials): Promise<Record<string, string>> {
  const cookie = await login(baseUrl, credentials);
  if (!cookie) {
    throw new Error("Failed to authenticate");
  }
  return { Cookie: cookie };
}
