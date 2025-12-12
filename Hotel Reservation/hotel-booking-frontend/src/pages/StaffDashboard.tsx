import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import useAppContext from "../hooks/useAppContext";
import UserManagement from "../components/UserManagement";
import {
  Users,
  Calendar,
  ClipboardList,
  Clock,
  Search,
  RefreshCw,
  Loader2,
  CalendarCheck,
  CalendarX,
  UserCheck,
  UserX,
  Phone,
  Mail,
  Wrench,
  Plus,
} from "lucide-react";

interface Booking {
  _id: string;
  hotelId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  checkIn: string;
  checkOut: string;
  adultCount: number;
  childCount: number;
  status: string;
  paymentStatus: string;
  totalCost?: number;
  specialRequests?: string;
  createdAt: string;
}

const StaffDashboard = () => {
  const { showToast } = useAppContext();
  const queryClient = useQueryClient();
  
  const [selectedTab, setSelectedTab] = useState("today");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [checkOutDialogOpen, setCheckOutDialogOpen] = useState(false);
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    hotelId: "",
    description: "",
    startDate: "",
    endDate: "",
    priority: "medium",
  });

  // Fetch all bookings (for staff view)
  const { data: allBookings, isLoading: loadingBookings, refetch: refetchBookings } = useQuery(
    "staffBookings",
    async () => {
      // This would need a staff-specific endpoint that returns all bookings
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/bookings/all`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch bookings");
      return response.json();
    },
    {
      retry: 1,
      onError: () => {
        // Fallback to my-bookings if all endpoint doesn't exist
      },
    }
  );

  // Update booking status mutation
  const updateStatusMutation = useMutation(
    async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/bookings/${bookingId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status }),
        }
      );
      if (!response.ok) throw new Error("Failed to update status");
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("staffBookings");
        showToast({
          title: "Status Updated",
          description: "Booking status has been updated successfully.",
          type: "SUCCESS",
        });
      },
      onError: () => {
        showToast({
          title: "Update Failed",
          description: "Failed to update booking status.",
          type: "ERROR",
        });
      },
    }
  );

  // Create maintenance record mutation
  const createMaintenanceMutation = useMutation(
    async (data: typeof maintenanceForm) => {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/maintenance`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) throw new Error("Failed to create maintenance record");
      return response.json();
    },
    {
      onSuccess: () => {
        showToast({
          title: "Maintenance Scheduled",
          description: "Maintenance record has been created.",
          type: "SUCCESS",
        });
        setMaintenanceDialogOpen(false);
        setMaintenanceForm({
          hotelId: "",
          description: "",
          startDate: "",
          endDate: "",
          priority: "medium",
        });
      },
      onError: () => {
        showToast({
          title: "Failed",
          description: "Failed to create maintenance record.",
          type: "ERROR",
        });
      },
    }
  );

  // Filter bookings based on tab and search
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const filteredBookings = (allBookings || []).filter((booking: Booking) => {
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        booking.firstName?.toLowerCase().includes(search) ||
        booking.lastName?.toLowerCase().includes(search) ||
        booking.email?.toLowerCase().includes(search) ||
        booking._id.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter !== "all" && booking.status !== statusFilter) {
      return false;
    }

    // Tab filter
    switch (selectedTab) {
      case "today":
        return checkIn <= today && checkOut > today;
      case "checkins":
        return checkIn.toDateString() === today.toDateString();
      case "checkouts":
        return checkOut.toDateString() === today.toDateString();
      case "upcoming":
        return checkIn > today;
      case "all":
      default:
        return true;
    }
  });

  // Calculate statistics
  const stats = {
    todayCheckins: (allBookings || []).filter((b: Booking) => 
      new Date(b.checkIn).toDateString() === today.toDateString()
    ).length,
    todayCheckouts: (allBookings || []).filter((b: Booking) => 
      new Date(b.checkOut).toDateString() === today.toDateString()
    ).length,
    currentGuests: (allBookings || []).filter((b: Booking) => {
      const ci = new Date(b.checkIn);
      const co = new Date(b.checkOut);
      return ci <= today && co > today && b.status === "confirmed";
    }).length,
    pendingBookings: (allBookings || []).filter((b: Booking) => 
      b.status === "pending"
    ).length,
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      confirmed: "bg-green-900/30 text-green-400 border-green-500/30",
      pending: "bg-yellow-900/30 text-yellow-400 border-yellow-500/30",
      cancelled: "bg-red-900/30 text-red-400 border-red-500/30",
      "checked-in": "bg-blue-900/30 text-blue-400 border-blue-500/30",
      "checked-out": "bg-gray-700/30 text-gray-400 border-gray-500/30",
    };
    return styles[status] || styles.pending;
  };

  const handleCheckIn = (booking: Booking) => {
    setSelectedBooking(booking);
    setCheckInDialogOpen(true);
  };

  const handleCheckOut = (booking: Booking) => {
    setSelectedBooking(booking);
    setCheckOutDialogOpen(true);
  };

  const confirmCheckIn = () => {
    if (selectedBooking) {
      updateStatusMutation.mutate({
        bookingId: selectedBooking._id,
        status: "checked-in",
      });
      setCheckInDialogOpen(false);
      setSelectedBooking(null);
    }
  };

  const confirmCheckOut = () => {
    if (selectedBooking) {
      updateStatusMutation.mutate({
        bookingId: selectedBooking._id,
        status: "checked-out",
      });
      setCheckOutDialogOpen(false);
      setSelectedBooking(null);
    }
  };

  return (
    <div className="min-h-screen bg-night-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <ClipboardList className="h-8 w-8 text-brand-400" />
              Staff Dashboard
            </h1>
            <p className="text-gray-400 mt-2">
              Manage bookings, check-ins, and hotel operations
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => refetchBookings()}
              className="border-white/20 text-gray-300 hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => setMaintenanceDialogOpen(true)}
              className="bg-brand-600 hover:bg-brand-700"
            >
              <Wrench className="h-4 w-4 mr-2" />
              Schedule Maintenance
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-night-800 border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Today's Check-ins</p>
                  <p className="text-3xl font-bold text-white">{stats.todayCheckins}</p>
                </div>
                <div className="p-3 bg-green-900/30 rounded-lg">
                  <CalendarCheck className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-night-800 border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Today's Check-outs</p>
                  <p className="text-3xl font-bold text-white">{stats.todayCheckouts}</p>
                </div>
                <div className="p-3 bg-orange-900/30 rounded-lg">
                  <CalendarX className="h-6 w-6 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-night-800 border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Current Guests</p>
                  <p className="text-3xl font-bold text-white">{stats.currentGuests}</p>
                </div>
                <div className="p-3 bg-blue-900/30 rounded-lg">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-night-800 border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Pending Bookings</p>
                  <p className="text-3xl font-bold text-white">{stats.pendingBookings}</p>
                </div>
                <div className="p-3 bg-yellow-900/30 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="bg-night-800 border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Booking Management</CardTitle>
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search guests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-night-900 border-white/10 text-white w-64"
                  />
                </div>
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-night-900 border border-white/10 rounded-md px-3 py-2 text-white text-sm"
                  aria-label="Filter by booking status"
                  title="Filter by booking status"
                >
                  <option value="all">All Status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="checked-in">Checked In</option>
                  <option value="checked-out">Checked Out</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
              <TabsList className="bg-night-900 border border-white/10">
                <TabsTrigger value="today" className="data-[state=active]:bg-brand-600">
                  <Users className="h-4 w-4 mr-2" />
                  Current Guests
                </TabsTrigger>
                <TabsTrigger value="checkins" className="data-[state=active]:bg-brand-600">
                  <CalendarCheck className="h-4 w-4 mr-2" />
                  Check-ins Today
                </TabsTrigger>
                <TabsTrigger value="checkouts" className="data-[state=active]:bg-brand-600">
                  <CalendarX className="h-4 w-4 mr-2" />
                  Check-outs Today
                </TabsTrigger>
                <TabsTrigger value="upcoming" className="data-[state=active]:bg-brand-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  Upcoming
                </TabsTrigger>
                <TabsTrigger value="all" className="data-[state=active]:bg-brand-600">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  All Bookings
                </TabsTrigger>
                <TabsTrigger value="users" className="data-[state=active]:bg-brand-600">
                  <Users className="h-4 w-4 mr-2" />
                  User Management
                </TabsTrigger>
              </TabsList>

              <div className="space-y-4">
                {loadingBookings ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
                  </div>
                ) : filteredBookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No bookings found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredBookings.map((booking: Booking) => {
                      const checkIn = new Date(booking.checkIn);
                      const checkOut = new Date(booking.checkOut);
                      const isCheckInToday = checkIn.toDateString() === today.toDateString();
                      const isCheckOutToday = checkOut.toDateString() === today.toDateString();
                      
                      return (
                        <div
                          key={booking._id}
                          className="bg-night-900 border border-white/10 rounded-lg p-6 hover:border-white/20 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold">
                                {booking.firstName?.[0]}{booking.lastName?.[0]}
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-white">
                                  {booking.firstName} {booking.lastName}
                                </h3>
                                <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {booking.email}
                                  </span>
                                  {booking.phone && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {booking.phone}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-400 mt-2">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {checkIn.toLocaleDateString()} - {checkOut.toLocaleDateString()}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {booking.adultCount} Adults, {booking.childCount} Children
                                  </span>
                                </div>
                                {booking.specialRequests && (
                                  <p className="text-sm text-brand-400 mt-2">
                                    Note: {booking.specialRequests}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-3">
                              <div className="flex items-center gap-2">
                                <Badge className={`${getStatusBadge(booking.status)} border`}>
                                  {booking.status}
                                </Badge>
                                {booking.totalCost && (
                                  <Badge variant="outline" className="border-white/20 text-gray-300">
                                    £{booking.totalCost}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {isCheckInToday && booking.status === "confirmed" && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleCheckIn(booking)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <UserCheck className="h-4 w-4 mr-1" />
                                    Check In
                                  </Button>
                                )}
                                {(booking.status === "checked-in" || isCheckOutToday) && 
                                 booking.status !== "checked-out" && 
                                 booking.status !== "cancelled" && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleCheckOut(booking)}
                                    className="bg-orange-600 hover:bg-orange-700"
                                  >
                                    <UserX className="h-4 w-4 mr-1" />
                                    Check Out
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Check-in Dialog */}
      <Dialog open={checkInDialogOpen} onOpenChange={setCheckInDialogOpen}>
        <DialogContent className="bg-night-800 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-400">
              <UserCheck className="h-5 w-5" />
              Confirm Check-in
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Check in {selectedBooking?.firstName} {selectedBooking?.lastName}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-night-900 p-4 rounded-lg space-y-2">
              <p className="text-sm text-gray-400">
                <strong className="text-white">Email:</strong> {selectedBooking?.email}
              </p>
              <p className="text-sm text-gray-400">
                <strong className="text-white">Guests:</strong> {selectedBooking?.adultCount} Adults, {selectedBooking?.childCount} Children
              </p>
              <p className="text-sm text-gray-400">
                <strong className="text-white">Check-out:</strong> {selectedBooking && new Date(selectedBooking.checkOut).toLocaleDateString()}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCheckInDialogOpen(false)}
              className="border-white/20 text-gray-300 hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmCheckIn}
              className="bg-green-600 hover:bg-green-700"
              disabled={updateStatusMutation.isLoading}
            >
              {updateStatusMutation.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Confirm Check-in
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Check-out Dialog */}
      <Dialog open={checkOutDialogOpen} onOpenChange={setCheckOutDialogOpen}>
        <DialogContent className="bg-night-800 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-400">
              <UserX className="h-5 w-5" />
              Confirm Check-out
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Check out {selectedBooking?.firstName} {selectedBooking?.lastName}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-night-900 p-4 rounded-lg space-y-2">
              <p className="text-sm text-gray-400">
                <strong className="text-white">Email:</strong> {selectedBooking?.email}
              </p>
              <p className="text-sm text-gray-400">
                <strong className="text-white">Stayed from:</strong> {selectedBooking && new Date(selectedBooking.checkIn).toLocaleDateString()}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCheckOutDialogOpen(false)}
              className="border-white/20 text-gray-300 hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmCheckOut}
              className="bg-orange-600 hover:bg-orange-700"
              disabled={updateStatusMutation.isLoading}
            >
              {updateStatusMutation.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <UserX className="h-4 w-4 mr-2" />
                  Confirm Check-out
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Maintenance Dialog */}
      <Dialog open={maintenanceDialogOpen} onOpenChange={setMaintenanceDialogOpen}>
        <DialogContent className="bg-night-800 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-brand-400" />
              Schedule Maintenance
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Block dates for hotel maintenance
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Hotel ID</Label>
              <Input
                placeholder="Enter hotel ID"
                value={maintenanceForm.hotelId}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, hotelId: e.target.value })}
                className="bg-night-900 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Description</Label>
              <Textarea
                placeholder="Maintenance details..."
                value={maintenanceForm.description}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                className="bg-night-900 border-white/10 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Start Date</Label>
                <Input
                  type="date"
                  value={maintenanceForm.startDate}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, startDate: e.target.value })}
                  className="bg-night-900 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">End Date</Label>
                <Input
                  type="date"
                  value={maintenanceForm.endDate}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, endDate: e.target.value })}
                  className="bg-night-900 border-white/10 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Priority</Label>
              <select
                value={maintenanceForm.priority}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, priority: e.target.value })}
                className="w-full bg-night-900 border border-white/10 rounded-md px-3 py-2 text-white"
                aria-label="Select maintenance priority"
                title="Select maintenance priority"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMaintenanceDialogOpen(false)}
              className="border-white/20 text-gray-300 hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={() => createMaintenanceMutation.mutate(maintenanceForm)}
              className="bg-brand-600 hover:bg-brand-700"
              disabled={createMaintenanceMutation.isLoading}
            >
              {createMaintenanceMutation.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffDashboard;
