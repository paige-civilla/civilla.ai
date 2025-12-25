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
