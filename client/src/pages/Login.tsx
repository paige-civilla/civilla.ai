import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import NavbarCream from "@/components/NavbarCream";
import Footer from "@/components/Footer";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [magicLinkEmail, setMagicLinkEmail] = useState("");
  const [error, setError] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [activeTab, setActiveTab] = useState<"password" | "magic">("password");

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return res.json();
    },
    onSuccess: () => {
      setLocation("/app/cases");
    },
    onError: (err: Error) => {
      setError(err.message || "Login failed");
    },
  });

  const magicLinkMutation = useMutation({
    mutationFn: async (data: { email: string }) => {
      const res = await apiRequest("POST", "/api/auth/magic-link/request", data);
      return res.json();
    },
    onSuccess: () => {
      setMagicLinkSent(true);
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to send magic link");
    },
  });

  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ email, password });
  };

  const handleMagicLink = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    magicLinkMutation.mutate({ email: magicLinkEmail });
  };

  return (
    <div className="flex flex-col min-h-screen bg-cream">
      <NavbarCream />
      
      <section className="bg-[#e7ebea] w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-20">
        <div className="flex flex-col items-center max-w-container w-full">
          <div className="flex flex-col gap-6 items-center max-w-[400px] w-full">
            <h1 className="font-heading font-bold text-heading-2-mobile md:text-heading-2 text-neutral-darkest text-center">
              Login
            </h1>

            <div className="flex gap-2 w-full">
              <button
                type="button"
                onClick={() => setActiveTab("password")}
                className={`flex-1 py-2 text-sm font-medium rounded-md ${
                  activeTab === "password"
                    ? "bg-bush text-white"
                    : "bg-white text-neutral-darkest border border-neutral-darkest/20"
                }`}
                data-testid="tab-password"
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("magic")}
                className={`flex-1 py-2 text-sm font-medium rounded-md ${
                  activeTab === "magic"
                    ? "bg-bush text-white"
                    : "bg-white text-neutral-darkest border border-neutral-darkest/20"
                }`}
                data-testid="tab-magic-link"
              >
                Magic Link
              </button>
            </div>

            {error && (
              <div className="w-full p-3 bg-red-100 border border-red-300 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}

            {activeTab === "password" ? (
              <form onSubmit={handlePasswordLogin} className="flex flex-col gap-4 w-full">
                <div className="flex flex-col gap-1">
                  <label htmlFor="email" className="text-sm font-medium text-neutral-darkest">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-darkest/20 rounded-md text-neutral-darkest"
                    required
                    data-testid="input-email"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="password" className="text-sm font-medium text-neutral-darkest">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-darkest/20 rounded-md text-neutral-darkest"
                    required
                    data-testid="input-password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full bg-bush text-white font-bold text-sm py-2.5 rounded-md button-inset-shadow disabled:opacity-50"
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? "Logging in..." : "Login"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleMagicLink} className="flex flex-col gap-4 w-full">
                {magicLinkSent ? (
                  <div className="w-full p-4 bg-green-100 border border-green-300 rounded-md text-green-700 text-sm text-center">
                    Check your email for a magic link to sign in.
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-1">
                      <label htmlFor="magic-email" className="text-sm font-medium text-neutral-darkest">
                        Email
                      </label>
                      <input
                        id="magic-email"
                        type="email"
                        value={magicLinkEmail}
                        onChange={(e) => setMagicLinkEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-darkest/20 rounded-md text-neutral-darkest"
                        required
                        data-testid="input-magic-email"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={magicLinkMutation.isPending}
                      className="w-full bg-bush text-white font-bold text-sm py-2.5 rounded-md button-inset-shadow disabled:opacity-50"
                      data-testid="button-magic-link"
                    >
                      {magicLinkMutation.isPending ? "Sending..." : "Send Magic Link"}
                    </button>
                  </>
                )}
              </form>
            )}

            <div className="w-full flex items-center gap-3">
              <div className="flex-1 h-px bg-neutral-darkest/20" />
              <span className="text-xs text-neutral-darkest/50">or</span>
              <div className="flex-1 h-px bg-neutral-darkest/20" />
            </div>

            <div className="flex flex-col gap-3 w-full">
              <a
                href="/api/auth/google/start"
                className="w-full flex items-center justify-center gap-2 bg-white border border-neutral-darkest/20 text-neutral-darkest font-medium text-sm py-2.5 rounded-md"
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
              <a
                href="/api/auth/apple/start"
                className="w-full flex items-center justify-center gap-2 bg-black text-white font-medium text-sm py-2.5 rounded-md"
                data-testid="button-apple-login"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Continue with Apple
              </a>
            </div>

            <p className="text-sm text-neutral-darkest/70 text-center">
              Don't have an account?{" "}
              <Link href="/register" className="text-bush font-medium underline" data-testid="link-register">
                Register
              </Link>
            </p>
          </div>
        </div>
      </section>

      <main className="flex-1 flex items-center justify-center px-5 py-12">
        <p className="font-sans text-[10px] text-neutral-darkest/60 text-center italic">
          *Educational, Research, And Organizational Support. Not Legal Advice Or Representation.*
        </p>
      </main>
      
      <Footer />
    </div>
  );
}
