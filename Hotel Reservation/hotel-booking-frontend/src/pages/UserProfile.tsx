import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import * as apiClient from "../api-client";
import { useAuthContext } from "@asgardeo/auth-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs.tsx";
import { Switch } from "../components/ui/switch.tsx";
import useAppContext from "../hooks/useAppContext";
import usePushNotifications from "../hooks/usePushNotifications";
import MyBookings from "./MyBookings"; // Added this line
import {
  User,
  Mail,
  Phone,
  Shield,
  Bell,
  Award,
  Gift,
  Star,
  Crown,
  Loader2,
  Save,
  LogOut,
  Settings,
  CreditCard,
  History,
  Sparkles,
  Smartphone,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

// Loyalty tier configuration
const LOYALTY_TIERS = [
  { name: "Bronze", minPoints: 0, color: "bg-amber-700", icon: Award, discount: 0 },
  { name: "Silver", minPoints: 1000, color: "bg-gray-400", icon: Star, discount: 5 },
  { name: "Gold", minPoints: 5000, color: "bg-yellow-500", icon: Crown, discount: 10 },
  { name: "Platinum", minPoints: 15000, color: "bg-purple-500", icon: Sparkles, discount: 15 },
];

// Push Notification Settings Component
const PushNotificationSettings = () => {
  const {
    isSupported,
    isSubscribed,
    permission,
    loading,
    error,
    subscribe,
    unsubscribe,
    sendTestNotification,
  } = usePushNotifications();
  const { showToast } = useAppContext();

  const handleToggle = async () => {
    try {
      if (isSubscribed) {
        await unsubscribe();
        showToast({
          title: "Push Notifications Disabled",
          description: "You will no longer receive push notifications.",
          type: "SUCCESS",
        });
      } else {
        await subscribe();
        showToast({
          title: "Push Notifications Enabled",
          description: "You will now receive push notifications.",
          type: "SUCCESS",
        });
      }
    } catch (err: any) {
      showToast({
        title: "Error",
        description: err.message || "Failed to update push notification settings.",
        type: "ERROR",
      });
    }
  };

  const handleTestNotification = async () => {
    const success = await sendTestNotification();
    if (success) {
      showToast({
        title: "Test Sent",
        description: "Check your notifications!",
        type: "SUCCESS",
      });
    } else {
      showToast({
        title: "Test Failed",
        description: "Could not send test notification.",
        type: "ERROR",
      });
    }
  };

  if (!isSupported) {
    return (
      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-gray-800/50">
            <Smartphone className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <h4 className="font-medium text-white">Push Notifications</h4>
            <p className="text-sm text-gray-400">Not supported in this browser</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl bg-white/5 border border-white/10 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${isSubscribed ? 'bg-brand-500/20' : 'bg-gray-800/50'}`}>
            <Smartphone className={`w-6 h-6 ${isSubscribed ? 'text-brand-400' : 'text-gray-400'}`} />
          </div>
          <div>
            <h4 className="text-lg font-medium text-white">Push Notifications</h4>
            <p className="text-sm text-gray-400">Receive instant updates about your bookings</p>
            {permission === "denied" && (
              <div className="flex items-center gap-2 mt-2 text-xs text-red-400">
                <AlertCircle className="w-3 h-3" />
                <span>Notifications are blocked in browser settings</span>
              </div>
            )}
            {error && (
              <p className="mt-1 text-xs text-red-400">{error}</p>
            )}
          </div>
        </div>
        <Switch
          checked={isSubscribed}
          onCheckedChange={handleToggle}
          disabled={loading || permission === "denied"}
        />
      </div>

      {isSubscribed && (
        <div className="pl-14">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestNotification}
            className="text-gray-300 border-white/20 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Bell className="w-4 h-4 mr-2" />
            Send Test Notification
          </Button>
        </div>
      )}
    </div>
  );
};

const UserProfile = () => {
  const { signOut } = useAuthContext();
  const { showToast } = useAppContext();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });

  const [notificationPrefs, setNotificationPrefs] = useState({
    emailBookingConfirmation: true,
    emailReminders: true,
    emailPromotions: false,
    smsBookingConfirmation: true,
    smsReminders: false,
  });

  const { data: user, isLoading } = useQuery(
    "fetchCurrentUser",
    apiClient.fetchCurrentUser,
    {
      onSuccess: (data) => {
        setFormData({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          phone: data.phone || "",
        });
      },
    }
  );

  const updateProfileMutation = useMutation(apiClient.updateUserProfile, {
    onSuccess: () => {
      queryClient.invalidateQueries("fetchCurrentUser");
      showToast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
        type: "SUCCESS",
      });
      setIsEditing(false);
    },
    onError: () => {
      showToast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        type: "ERROR",
      });
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(formData);
  };

  const getCurrentTier = (points: number) => {
    for (let i = LOYALTY_TIERS.length - 1; i >= 0; i--) {
      if (points >= LOYALTY_TIERS[i].minPoints) {
        return LOYALTY_TIERS[i];
      }
    }
    return LOYALTY_TIERS[0];
  };

  const getNextTier = (points: number) => {
    for (const tier of LOYALTY_TIERS) {
      if (points < tier.minPoints) {
        return tier;
      }
    }
    return null;
  };

  // Calculate loyalty points based on total spent (1 point per £1)
  const loyaltyPoints = Math.floor(user?.totalSpent || 0);
  const currentTier = getCurrentTier(loyaltyPoints);
  const nextTier = getNextTier(loyaltyPoints);
  const progressToNextTier = nextTier
    ? ((loyaltyPoints - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100
    : 100;

  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (progressBarRef.current) {
      progressBarRef.current.style.width = `${progressToNextTier}%`;
    }
  }, [progressToNextTier]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-night-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-brand-400" />
          <span className="text-lg font-medium text-gray-400">Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 bg-night-950 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-500/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[100px]" />
      </div>

      <div className="max-w-5xl px-4 mx-auto sm:px-6 lg:px-8 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight mb-2">My Profile</h1>
            <p className="text-gray-400 text-lg">Manage your account settings and preferences</p>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 rounded-full glass-panel bg-white/5">
            <div className={`w-3 h-3 rounded-full ${currentTier.color} shadow-[0_0_10px_currentColor]`} />
            <span className="font-medium text-white">{currentTier.name} Member</span>
            <span className="text-gray-500">|</span>
            <span className="text-brand-400 font-bold">{loyaltyPoints.toLocaleString()} pts</span>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-8">
          <TabsList className="w-full p-1 bg-black/20 backdrop-blur-xl border border-white/10 rounded-xl flex justify-start overflow-x-auto">
            <TabsTrigger 
              value="profile" 
              className="flex-1 min-w-[120px] data-[state=active]:bg-brand-600 data-[state=active]:text-white text-gray-400 hover:text-white transition-all duration-300"
            >
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="bookings"
              className="flex-1 min-w-[120px] data-[state=active]:bg-brand-600 data-[state=active]:text-white text-gray-400 hover:text-white transition-all duration-300"
            >
              <History className="w-4 h-4 mr-2" />
              Booking History
            </TabsTrigger>
            <TabsTrigger 
              value="loyalty" 
              className="flex-1 min-w-[120px] data-[state=active]:bg-brand-600 data-[state=active]:text-white text-gray-400 hover:text-white transition-all duration-300"
            >
              <Award className="w-4 h-4 mr-2" />
              Loyalty
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="flex-1 min-w-[120px] data-[state=active]:bg-brand-600 data-[state=active]:text-white text-gray-400 hover:text-white transition-all duration-300"
            >
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="flex-1 min-w-[120px] data-[state=active]:bg-brand-600 data-[state=active]:text-white text-gray-400 hover:text-white transition-all duration-300"
            >
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="focus-visible:outline-none">
            <div className="glass-panel rounded-2xl p-8 space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-white/10">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-night-900 p-1.5 rounded-full border border-white/10">
                      <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {user?.firstName} {user?.lastName}
                    </h2>
                    <p className="text-gray-400 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {user?.email}
                    </p>
                  </div>
                </div>
                
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    className="border-white/20 hover:bg-white/10 text-white gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setIsEditing(false)}
                      variant="ghost"
                      className="text-gray-400 hover:text-white hover:bg-white/5"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveProfile}
                      className="bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-500/25"
                      disabled={updateProfileMutation.isLoading}
                    >
                      {updateProfileMutation.isLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-gray-400 font-medium">First Name</Label>
                  {isEditing ? (
                    <Input
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="bg-black/20 border-white/10 text-white focus:border-brand-500 focus:ring-brand-500/20"
                    />
                  ) : (
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-white">
                      {user?.firstName || "Not set"}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-400 font-medium">Last Name</Label>
                  {isEditing ? (
                    <Input
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="bg-black/20 border-white/10 text-white focus:border-brand-500 focus:ring-brand-500/20"
                    />
                  ) : (
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-white">
                      {user?.lastName || "Not set"}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-400 font-medium">Email Address</Label>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-gray-300 flex justify-between items-center">
                    <span>{user?.email}</span>
                    <Badge variant="outline" className="border-brand-500/30 text-brand-400 bg-brand-500/10">Verified</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-400 font-medium">Phone Number</Label>
                  {isEditing ? (
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter your phone number"
                      className="bg-black/20 border-white/10 text-white focus:border-brand-500 focus:ring-brand-500/20"
                    />
                  ) : (
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-white">
                      {user?.phone || "Not set"}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-8 border-t border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Account Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-brand-500/20 text-brand-400">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Total Spent</p>
                      <p className="text-xl font-bold text-white">£{user?.totalSpent?.toLocaleString() || "0"}</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-purple-500/20 text-purple-400">
                      <History className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Member Since</p>
                      <p className="text-xl font-bold text-white">
                        {new Date(user?.createdAt || Date.now()).getFullYear()}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-green-500/20 text-green-400">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Account Status</p>
                      <p className="text-xl font-bold text-white">Active</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Booking History Tab */}
          <TabsContent value="bookings" className="focus-visible:outline-none">
            <MyBookings />
          </TabsContent>

          {/* Loyalty Tab */}
          <TabsContent value="loyalty" className="focus-visible:outline-none">
            <div className="space-y-8">
              {/* Main Status Card */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-purple-700 p-8 shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="flex items-center gap-6">
                    <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-md shadow-inner">
                      <currentTier.icon className="w-12 h-12 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-1">{currentTier.name} Status</h2>
                      <p className="text-white/80 text-lg">Enjoy {currentTier.discount}% off on all bookings</p>
                    </div>
                  </div>
                  <div className="text-center md:text-right">
                    <div className="text-5xl font-bold text-white mb-1">{loyaltyPoints.toLocaleString()}</div>
                    <div className="text-white/80 font-medium">Total Loyalty Points</div>
                  </div>
                </div>

                {nextTier && (
                  <div className="mt-8 relative z-10">
                    <div className="flex justify-between text-sm text-white/90 mb-2 font-medium">
                      <span>Current: {currentTier.name}</span>
                      <span>Next: {nextTier.name}</span>
                    </div>
                    <div className="w-full h-4 rounded-full bg-black/20 backdrop-blur-sm overflow-hidden">
                      <div
                        ref={progressBarRef}
                        className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-1000 ease-out"
                      />
                    </div>
                    <p className="mt-2 text-sm text-white/80 text-center">
                      Earn <span className="font-bold text-white">{(nextTier.minPoints - loyaltyPoints).toLocaleString()}</span> more points to unlock {nextTier.name} benefits
                    </p>
                  </div>
                )}
              </div>

              {/* Benefits Grid */}
              <div className="glass-panel rounded-2xl p-8">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-brand-400" />
                  Membership Tiers & Benefits
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {LOYALTY_TIERS.map((tier) => (
                    <div
                      key={tier.name}
                      className={`relative p-6 rounded-xl border transition-all duration-300 ${
                        currentTier.name === tier.name
                          ? "bg-brand-500/10 border-brand-500/50 shadow-[0_0_20px_rgba(79,70,229,0.15)]"
                          : "bg-white/5 border-white/5 hover:bg-white/10"
                      }`}
                    >
                      {currentTier.name === tier.name && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand-500 text-white text-xs font-bold shadow-lg">
                          CURRENT
                        </div>
                      )}
                      <div className={`w-10 h-10 rounded-lg ${tier.color} flex items-center justify-center mb-4`}>
                        <tier.icon className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="text-lg font-bold text-white mb-1">{tier.name}</h4>
                      <p className="text-sm text-gray-400 mb-4">{tier.minPoints.toLocaleString()}+ points</p>
                      <div className="flex items-center gap-2 text-brand-400 font-medium">
                        <Sparkles className="w-4 h-4" />
                        {tier.discount}% Discount
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Earning Rules */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-xl flex flex-col items-center text-center hover:bg-white/5 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                    <CreditCard className="w-6 h-6 text-green-400" />
                  </div>
                  <h4 className="text-white font-bold mb-2">Book & Earn</h4>
                  <p className="text-gray-400 text-sm">Earn 1 point for every £1 spent on your hotel bookings</p>
                </div>
                <div className="glass-panel p-6 rounded-xl flex flex-col items-center text-center hover:bg-white/5 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                    <Gift className="w-6 h-6 text-blue-400" />
                  </div>
                  <h4 className="text-white font-bold mb-2">Welcome Bonus</h4>
                  <p className="text-gray-400 text-sm">Get 500 bonus points instantly on your first booking</p>
                </div>
                <div className="glass-panel p-6 rounded-xl flex flex-col items-center text-center hover:bg-white/5 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
                    <Star className="w-6 h-6 text-amber-400" />
                  </div>
                  <h4 className="text-white font-bold mb-2">Review Rewards</h4>
                  <p className="text-gray-400 text-sm">Earn 100 points for every review you leave after a stay</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="focus-visible:outline-none">
            <div className="glass-panel rounded-2xl p-8 max-w-3xl mx-auto">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Notification Preferences</h2>
                <p className="text-gray-400">Manage how and when you want to be notified</p>
              </div>

              <div className="space-y-8">
                {/* Email Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Mail className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Email Notifications</h3>
                  </div>
                  
                  <div className="space-y-1">
                    {[
                      { 
                        label: "Booking Confirmations", 
                        desc: "Receive detailed confirmation emails when you book",
                        key: "emailBookingConfirmation" 
                      },
                      { 
                        label: "Check-in Reminders", 
                        desc: "Get helpful reminders 24h before your stay",
                        key: "emailReminders" 
                      },
                      { 
                        label: "Promotional Offers", 
                        desc: "Be the first to know about deals and special offers",
                        key: "emailPromotions" 
                      }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors">
                        <div>
                          <p className="text-white font-medium">{item.label}</p>
                          <p className="text-sm text-gray-400">{item.desc}</p>
                        </div>
                        <Switch
                          checked={notificationPrefs[item.key as keyof typeof notificationPrefs]}
                        onCheckedChange={(checked: boolean) =>
                          setNotificationPrefs({ ...notificationPrefs, [item.key]: checked })
                        }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-white/10" />

                {/* SMS Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <Phone className="w-5 h-5 text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">SMS Notifications</h3>
                  </div>
                  
                  <div className="space-y-1">
                    {[
                      { 
                        label: "Booking Confirmations", 
                        desc: "Receive instant SMS when you book",
                        key: "smsBookingConfirmation" 
                      },
                      { 
                        label: "Check-in Reminders", 
                        desc: "SMS reminders on the day of check-in",
                        key: "smsReminders" 
                      }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors">
                        <div>
                          <p className="text-white font-medium">{item.label}</p>
                          <p className="text-sm text-gray-400">{item.desc}</p>
                        </div>
                        <Switch
                          checked={notificationPrefs[item.key as keyof typeof notificationPrefs]}
                        onCheckedChange={(checked: boolean) =>
                          setNotificationPrefs({ ...notificationPrefs, [item.key]: checked })
                        }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-white/10" />

                {/* Push Notifications */}
                <PushNotificationSettings />

                <div className="pt-4">
                  <Button className="w-full bg-brand-600 hover:bg-brand-700 text-white py-6 text-lg shadow-lg shadow-brand-500/25">
                    <Save className="w-5 h-5 mr-2" />
                    Save Preferences
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="focus-visible:outline-none">
            <div className="glass-panel rounded-2xl p-8 max-w-3xl mx-auto space-y-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Security Settings</h2>
                <p className="text-gray-400">Manage your account security and sessions</p>
              </div>

              <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/20">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-green-500/20">
                    <Shield className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-2">Secured by Asgardeo</h4>
                    <p className="text-gray-300 mb-4">
                      Your account is protected by enterprise-grade security. 
                      Password management, multi-factor authentication, and login history are handled securely by Asgardeo Identity Provider.
                    </p>
                    <Badge className="bg-green-500 hover:bg-green-600 text-white border-0">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Active Protection
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Active Sessions</h3>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-white/10">
                      <Smartphone className="w-6 h-6 text-gray-300" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Current Session</p>
                      <p className="text-sm text-gray-400">
                        Started {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Active Now
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-white/10">
                <Button
                  onClick={() => signOut()}
                  variant="destructive"
                  className="w-full py-6 text-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Sign Out of All Devices
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserProfile;