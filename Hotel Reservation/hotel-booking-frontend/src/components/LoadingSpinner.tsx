import { Building2 } from "lucide-react";

type LoadingSpinnerProps = {
  message?: string;
};

const LoadingSpinner = ({
  message = "Creating your profile...",
}: LoadingSpinnerProps) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-night-900/75 backdrop-blur-xl">
      <div className="relative w-full max-w-md rounded-[32px] border border-white/10 bg-white/95 p-10 text-center shadow-[0_50px_120px_rgba(6,9,22,0.35)]">
        <div className="absolute -inset-1 rounded-[36px] bg-gradient-to-br from-[#93B7FF]/40 via-transparent to-transparent blur-3xl" aria-hidden />
        <div className="relative flex flex-col items-center space-y-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#3F6BFF]/30 bg-[#F7F9FF] text-[#3460FF]">
            <Building2 className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-night-900">{message}</h3>
            <p className="text-base text-night-600">
              Please wait while we prepare everything for you...
            </p>
          </div>

          <div className="flex items-center gap-2">
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                className={`h-2.5 w-2.5 rounded-full bg-[#3362FF] animate-loading-bounce ${
                  dot === 1
                    ? "[animation-delay:0.15s]"
                    : dot === 2
                    ? "[animation-delay:0.3s]"
                    : ""
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
