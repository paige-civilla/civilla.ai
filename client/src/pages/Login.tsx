import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import NavbarCream from "@/components/NavbarCream";
import Footer from "@/components/Footer";
import { PasswordField } from "@/components/ui/PasswordField";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [redirecting, setRedirecting] = useState(false);

  const { data: authData } = useQuery<{ user: { id: string; email: string; casesAllowed: number } }>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const { data: oauthStatus } = useQuery<{ google: boolean; apple: boolean }>({
    queryKey: ["/api/auth/oauth-status"],
  });

  useEffect(() => {
    if (authData?.user && !redirecting) {
      handlePostLoginRedirect();
    }
  }, [authData]);

  const handlePostLoginRedirect = () => {
    setRedirecting(true);
    setLocation("/app");
  };

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      handlePostLoginRedirect();
    },
    onError: (err: Error) => {
      setError(err.message || "Login failed");
    },
  });

  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <NavbarCream />
      
      <section className="flex-1 w-full flex flex-col items-center justify-center px-5 py-10 md:py-16">
        <div className="max-w-[420px] w-full">
          <div className="rounded-2xl border border-[hsl(var(--app-panel-border))] bg-[hsl(var(--app-panel))] backdrop-blur-sm shadow-sm p-6 md:p-8 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-[28px] md:text-[32px] font-figtree font-semibold tracking-tight text-foreground">
                Login
              </h1>
              <p className="text-[14px] leading-6 text-muted-foreground">
                Welcome Back!
              </p>
            </div>

            {error && (
              <div className="w-full p-4 bg-destructive/10 border border-destructive/30 rounded-md">
                <p className="font-sans text-sm text-destructive">{error}</p>
              </div>
            )}

            <form onSubmit={handlePasswordLogin} className="flex flex-col gap-4 w-full">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="font-sans text-sm font-medium text-foreground">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 min-h-11 border border-border rounded-md font-sans text-sm text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
                  required
                  data-testid="input-email"
                />
              </div>
              <PasswordField
                label="Password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-password"
              />
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full bg-bush text-white font-bold text-sm min-h-11 rounded-md button-inset-shadow disabled:opacity-50"
                data-testid="button-login"
              >
                {loginMutation.isPending ? "Logging in..." : "Login"}
              </button>
            </form>

            <div className="w-full flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[12px] uppercase tracking-wide text-muted-foreground">or continue with</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="flex flex-col gap-3 w-full">
              <div className="flex flex-col gap-1">
                {oauthStatus?.google ? (
                  <a
                    href="/api/auth/google/start"
                    className="w-full flex items-center justify-center gap-2 bg-card border border-border text-foreground font-sans font-medium text-sm min-h-11 rounded-md hover:bg-accent transition-colors"
                    data-testid="button-google-login"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </a>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    <button
                      disabled
                      className="w-full flex items-center justify-center gap-2 bg-card border border-border text-muted-foreground font-sans font-medium text-sm min-h-11 rounded-md cursor-not-allowed opacity-50"
                      data-testid="button-google-login"
                    >
                      <svg className="w-5 h-5 opacity-50" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google
                    </button>
                    <span className="font-sans text-xs text-muted-foreground text-center">Coming soon</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                {oauthStatus?.apple ? (
                  <a
                    href="/api/auth/apple/start"
                    className="w-full flex items-center justify-center gap-2 bg-foreground text-background font-sans font-medium text-sm min-h-11 rounded-md hover:opacity-90 transition-colors"
                    data-testid="button-apple-login"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    Continue with Apple
                  </a>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    <button
                      disabled
                      className="w-full flex items-center justify-center gap-2 bg-foreground/50 text-background/70 font-sans font-medium text-sm min-h-11 rounded-md cursor-not-allowed"
                      data-testid="button-apple-login"
                    >
                      <svg className="w-5 h-5 opacity-70" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                      </svg>
                      Continue with Apple
                    </button>
                    <span className="font-sans text-xs text-muted-foreground text-center">Coming soon</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <p className="font-sans text-sm text-muted-foreground text-center mt-6">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary hover:underline" data-testid="link-register">
              Create account
            </Link>
          </p>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
