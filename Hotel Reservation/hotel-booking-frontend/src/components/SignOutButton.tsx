import { useQueryClient } from "react-query";
import * as apiClient from "../api-client";
import useAppContext from "../hooks/useAppContext";
import { useNavigate } from "react-router-dom";
import { LogOut, RefreshCw, ChevronDown } from "lucide-react";
import { useAuthContext } from "@asgardeo/auth-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const SignOutButton = () => {
  const queryClient = useQueryClient();
  const { showToast } = useAppContext();
  const navigate = useNavigate();
  const { signOut } = useAuthContext();

  const handleSignOut = async () => {
    try {
      await signOut();
      await queryClient.clear();
      showToast({
        title: "Successfully Signed Out",
        description: "You have been logged out of your account.",
        type: "SUCCESS",
      });
      navigate("/");
    } catch (error) {
      showToast({
        title: "Sign Out Failed",
        description: (error as Error)?.message || "Please try again",
        type: "ERROR",
      });
    }
  };

  const handleClearAuth = () => {
    apiClient.clearAllStorage();
    showToast({
      title: "Storage Cleared",
      description: "Local storage and cookies cleared. Reloading...",
      type: "SUCCESS",
    });
    window.location.reload();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-5 py-2 rounded-full border border-white/20 text-white hover:border-white/60 transition-colors">
          <LogOut className="w-4 h-4" />
          Sign Out
          <ChevronDown className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-white" align="end">
        <DropdownMenuItem onClick={handleSignOut} className="text-primary-600">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </DropdownMenuItem>

        {/* Development utilities - only show in development */}
        {!import.meta.env.PROD && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleClearAuth}
              className="text-orange-600"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Clear All Storage
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SignOutButton;
