import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import NavbarCream from "@/components/NavbarCream";
import Footer from "@/components/Footer";

export default function Register() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const registerMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/register", data);
      return res.json();
    },
    onSuccess: () => {
      setLocation("/app/cases");
    },
    onError: (err: Error) => {
      setError(err.message || "Registration failed");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    registerMutation.mutate({ email, password });
  };

  return (
    <div className="flex flex-col min-h-screen bg-cream">
      <NavbarCream />
      
      <section className="bg-[#e7ebea] w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-20">
        <div className="flex flex-col items-center max-w-container w-full">
          <div className="flex flex-col gap-6 items-center max-w-[400px] w-full">
            <h1 className="font-heading font-bold text-heading-2-mobile md:text-heading-2 text-neutral-darkest text-center">
              Create Account
            </h1>

            {error && (
              <div className="w-full p-3 bg-red-100 border border-red-300 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
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
                  minLength={8}
                  data-testid="input-password"
                />
                <span className="text-xs text-neutral-darkest/60">At least 8 characters</span>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="confirm-password" className="text-sm font-medium text-neutral-darkest">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-darkest/20 rounded-md text-neutral-darkest"
                  required
                  data-testid="input-confirm-password"
                />
              </div>
              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full bg-bush text-white font-bold text-sm py-2.5 rounded-md button-inset-shadow disabled:opacity-50"
                data-testid="button-register"
              >
                {registerMutation.isPending ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <p className="text-sm text-neutral-darkest/70 text-center">
              Already have an account?{" "}
              <Link href="/login" className="text-bush font-medium underline" data-testid="link-login">
                Login
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
