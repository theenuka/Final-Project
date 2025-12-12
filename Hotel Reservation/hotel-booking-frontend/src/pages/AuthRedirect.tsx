import { useEffect } from "react";
import { useAuthContext } from "@asgardeo/auth-react";
import { useSearchParams, useNavigate } from "react-router-dom";

const AuthRedirect = () => {
  const { signIn, state } = useAuthContext();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const hasCode = searchParams.has("code");

  useEffect(() => {
    // Only initiate sign-in if we are not authenticated AND we don't have a code (callback)
    if (!state.isAuthenticated && !hasCode && !state.isLoading) {
      signIn().catch((e) => console.error("Sign-in failed:", e));
    }
  }, [signIn, state.isAuthenticated, hasCode, state.isLoading]);

  if (!state.isLoading && hasCode && !state.isAuthenticated) {
    return (
      <main className="min-h-[50vh] flex flex-col items-center justify-center text-center px-6 py-24">
        <h1 className="text-3xl font-semibold text-red-500">Sign In Failed</h1>
        <p className="mt-4 text-white/70">
          We couldn't verify your credentials. Please try again.
        </p>
        {(state as any).error && (
          <div className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded text-left max-w-2xl overflow-auto">
            <p className="text-red-400 font-mono text-sm">
              {JSON.stringify((state as any).error, null, 2)}
            </p>
          </div>
        )}
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => signIn()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
          >
            Retry Sign In
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md font-medium transition-colors"
          >
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[50vh] flex flex-col items-center justify-center text-center px-6 py-24">
      <p className="text-sm uppercase tracking-[0.2em] text-gray-400">
        {hasCode ? "Completing Sign In..." : "Redirecting to Asgardeo"}
      </p>
      <h1 className="mt-4 text-3xl font-semibold text-white">
        {hasCode ? "Verifying your credentials..." : "Hold tight, taking you to the secure login…"}
      </h1>
      <p className="mt-3 text-base text-white/70 max-w-xl">
        If the Asgardeo login page doesn’t appear automatically, refresh the page or click the
        Sign In button in the header.
      </p>
    </main>
  );
};

export default AuthRedirect;
