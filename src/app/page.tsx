"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import {
  Calendar,
  RefreshCw,
  Plus,
  LogOut,
  Sparkles,
  ArrowRight,
  Clock,
  MapPin,
  Moon,
  Sun,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  location?: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [isScrolled, setIsScrolled] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
  });

  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 300], [0, -50]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.8]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const setupWebhook = async () => {
    try {
      const response = await fetch("/api/calendar/webhook/setup", {
        method: "POST",
      });

      if (response.ok) {
        console.log("Webhook setup successfully");
      } else {
        console.log("Failed to setup webhook");
      }
    } catch (error) {
      console.error("Error setting up webhook:", error);
    }
  };

  const fetchEvents = async () => {
    if (!session) return;

    setLoading(true);
    try {
      const response = await fetch("/api/calendar/events");
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      } else {
        toast.error("Failed to fetch events");
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Error fetching events");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = () => {
    if (newEvent.title && newEvent.startTime && newEvent.endTime) {
      const createEvent = async () => {
        try {
          const response = await fetch("/api/calendar/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newEvent),
          });

          if (response.ok) {
            toast.success("Event created successfully");
            setShowCreateForm(false);
            setNewEvent({
              title: "",
              description: "",
              startTime: "",
              endTime: "",
              location: "",
            });
            fetchEvents();
          } else {
            toast.error("Failed to create event");
          }
        } catch (error) {
          console.error("Error creating event:", error);
          toast.error("Error creating event");
        }
      };
      createEvent();
    }
  };

  useEffect(() => {
    async function fetchAll() {
      if (session) {
        await fetchEvents();
        setupWebhook();
      }
    }
    fetchAll();
  }, [session]);

  // Animated Background Components
  const MovingOrb = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute top-1/4 left-1/4 w-[400px] h-[400px]"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="w-full h-full bg-gradient-radial from-white/10 to-transparent rounded-full blur-3xl" />
      </motion.div>
      <motion.div
        className="absolute top-3/4 right-1/4 w-[300px] h-[300px]"
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.1, 0.15, 0.1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="w-full h-full bg-gradient-radial from-gray-300/20 dark:from-white/20 to-transparent rounded-full blur-2xl" />
      </motion.div>
    </div>
  );

  const FloatingHeader = () => {
    return (
      <>
        <motion.header
          className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className={`flex items-center gap-6 px-6 py-3 rounded-full border backdrop-blur-xl transition-all duration-500 ${
              isScrolled
                ? "bg-gradient-to-r from-blue-50/90 via-white/90 to-blue-50/90 dark:bg-gradient-to-r dark:from-blue-950/90 dark:via-black/90 dark:to-blue-950/90 border-blue-200 dark:border-blue-800 shadow-2xl"
                : "bg-gradient-to-r from-blue-50/70 via-white/70 to-blue-50/70 dark:bg-gradient-to-r dark:from-blue-950/70 dark:via-black/70 dark:to-blue-950/70 border-blue-200/50 dark:border-blue-800/50 shadow-xl"
            }`}
            whileHover={{
              scale: 1.02,
              boxShadow: "0 20px 40px -12px rgba(59, 130, 246, 0.3)",
            }}
          >
            {/* Logo */}
            <motion.div
              className="flex items-center gap-3 text-gray-900 dark:text-white"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 dark:from-blue-400 dark:via-blue-500 dark:to-blue-600 flex items-center justify-center shadow-lg ring-2 ring-blue-200/50 dark:ring-blue-400/30">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-black dark:text-white">
                SyncCal
              </span>
            </motion.div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <motion.button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </motion.button>

              {/* Auth Section */}
              {session ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={session.user?.image || ""}
                          alt={session.user?.name || ""}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 dark:from-blue-400 dark:via-blue-500 dark:to-blue-600 text-white">
                          {session.user?.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("") || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-56 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-gray-200 dark:border-gray-800"
                    align="end"
                    forceMount
                  >
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {session.user?.name}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {session.user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 border-0 rounded-full px-4 shadow-lg"
                  onClick={() => signIn("google")}
                >
                  Sign in
                </Button>
              )}
            </div>
          </motion.div>
        </motion.header>
      </>
    );
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-white dark:bg-black">
        {/* Animated background gradients */}
        <MovingOrb />

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="w-full max-w-md backdrop-blur-sm bg-white/90 dark:bg-black/90 border-gray-200 dark:border-gray-800 shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader className="text-center space-y-6 p-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="mx-auto"
                >
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 dark:from-blue-400 dark:via-blue-500 dark:to-blue-600 flex items-center justify-center shadow-lg ring-4 ring-blue-200/30 dark:ring-blue-400/20">
                      <Calendar className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-4"
                >
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      Real-time sync
                    </span>
                  </div>

                  <CardTitle className="text-4xl font-bold text-black dark:text-white">
                    SyncCal
                  </CardTitle>
                  <CardDescription className="mt-4 text-lg leading-relaxed text-gray-600 dark:text-gray-400">
                    Connect your Google account to sync your calendar events in
                    real-time with smart notifications
                  </CardDescription>
                </motion.div>
              </CardHeader>

              <CardContent className="space-y-6 p-8 pt-0">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <Button
                    onClick={() => signIn("google")}
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
                    size="lg"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      <svg className="h-6 w-6" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Connect Google Account
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                    </span>
                  </Button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-center text-sm text-gray-500 dark:text-gray-500 pt-4 border-t border-gray-200 dark:border-gray-800"
                >
                  Secure OAuth2 authentication with real-time webhook updates
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-white dark:bg-black">
      {/* Animated background gradients */}
      <MovingOrb />

      <FloatingHeader />

      <main className="relative z-10 pt-28 pb-20">
        <div className="container mx-auto px-6">
          {/* Hero Section */}
          <motion.div
            className="text-center mb-12"
            style={{ y: heroY, opacity: heroOpacity }}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                Connected & Synced
              </span>
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900 dark:text-white">
              Your Calendar Events
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
              Manage your Google Calendar events with real-time synchronization
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={fetchEvents}
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                  <motion.div
                    animate={loading ? { rotate: 360 } : { rotate: 0 }}
                    transition={{
                      duration: 1,
                      repeat: loading ? Infinity : 0,
                      ease: "linear",
                    }}
                    className="mr-2"
                  >
                    <RefreshCw className="h-5 w-5" />
                  </motion.div>
                  {loading ? "Syncing..." : "Sync Calendar"}
                </Button>
              </motion.div>

              <AlertDialog
                open={showCreateForm}
                onOpenChange={setShowCreateForm}
              >
                <AlertDialogTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant="outline"
                      className="px-8 py-3 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950 backdrop-blur-sm rounded-2xl transition-all duration-300"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Create Event
                    </Button>
                  </motion.div>
                </AlertDialogTrigger>
                <AlertDialogContent className="sm:max-w-[500px] bg-white/95 dark:bg-black/95 backdrop-blur-xl border-gray-200 dark:border-gray-800 rounded-3xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl font-bold">
                      Create New Event
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-base">
                      Fill in the details for your new calendar event.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="grid gap-6 py-6">
                    <div className="grid gap-3">
                      <Label htmlFor="title" className="text-sm font-semibold">
                        Title
                      </Label>
                      <Input
                        id="title"
                        value={newEvent.title}
                        onChange={(e) =>
                          setNewEvent((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        placeholder="Event title"
                        className="h-12 bg-white/50 dark:bg-black/50 backdrop-blur-sm border-gray-200 dark:border-gray-800 rounded-xl"
                      />
                    </div>
                    <div className="grid gap-3">
                      <Label
                        htmlFor="description"
                        className="text-sm font-semibold"
                      >
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        value={newEvent.description}
                        onChange={(e) =>
                          setNewEvent((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        placeholder="Event description"
                        className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border-gray-200 dark:border-gray-800 rounded-xl resize-none"
                        rows={3}
                      />
                    </div>
                    <div className="grid gap-3">
                      <Label
                        htmlFor="location"
                        className="text-sm font-semibold"
                      >
                        Location
                      </Label>
                      <Input
                        id="location"
                        value={newEvent.location}
                        onChange={(e) =>
                          setNewEvent((prev) => ({
                            ...prev,
                            location: e.target.value,
                          }))
                        }
                        placeholder="Event location"
                        className="h-12 bg-white/50 dark:bg-black/50 backdrop-blur-sm border-gray-200 dark:border-gray-800 rounded-xl"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-3">
                        <Label
                          htmlFor="startDateTime"
                          className="text-sm font-semibold"
                        >
                          Start Date & Time
                        </Label>
                        <Input
                          id="startDateTime"
                          type="datetime-local"
                          value={newEvent.startTime}
                          onChange={(e) =>
                            setNewEvent((prev) => ({
                              ...prev,
                              startTime: e.target.value,
                            }))
                          }
                          className="h-12 bg-white/50 dark:bg-black/50 backdrop-blur-sm border-gray-200 dark:border-gray-800 rounded-xl"
                        />
                      </div>
                      <div className="grid gap-3">
                        <Label
                          htmlFor="endDateTime"
                          className="text-sm font-semibold"
                        >
                          End Date & Time
                        </Label>
                        <Input
                          id="endDateTime"
                          type="datetime-local"
                          value={newEvent.endTime}
                          onChange={(e) =>
                            setNewEvent((prev) => ({
                              ...prev,
                              endTime: e.target.value,
                            }))
                          }
                          className="h-12 bg-white/50 dark:bg-black/50 backdrop-blur-sm border-gray-200 dark:border-gray-800 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                  <AlertDialogFooter className="gap-3">
                    <AlertDialogCancel className="rounded-xl">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCreateEvent}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 rounded-xl"
                    >
                      Create Event
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </motion.div>

          {/* Events Section */}
          <AnimatePresence mode="wait">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Syncing your calendar events...
                  </p>
                </div>
              </div>
            ) : events.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="max-w-2xl mx-auto"
              >
                <Card className="bg-white/90 dark:bg-black/90 backdrop-blur-sm border-gray-200 dark:border-gray-800 rounded-3xl shadow-xl">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: 0.2,
                        type: "spring",
                        stiffness: 200,
                      }}
                      className="mb-6"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center">
                        <Calendar className="h-8 w-8 text-gray-600 dark:text-gray-400" />
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="space-y-4"
                    >
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        No events found
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 max-w-md">
                        Create your first event or sync your calendar to see
                        your upcoming events here
                      </p>
                      <div className="flex gap-3 justify-center pt-4">
                        <Button
                          onClick={() => setShowCreateForm(true)}
                          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 rounded-xl"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create Event
                        </Button>
                        <Button
                          onClick={fetchEvents}
                          variant="outline"
                          className="border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-xl"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Sync Calendar
                        </Button>
                      </div>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="events"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="max-w-4xl mx-auto"
              >
                <div className="grid gap-4">
                  {events.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      whileHover={{ y: -2, scale: 1.005 }}
                    >
                      <Card className="bg-white/90 dark:bg-black/90 backdrop-blur-xl border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 hover:shadow-lg rounded-2xl overflow-hidden">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                {event.summary || "Untitled Event"}
                              </h3>
                              {event.description && (
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                                  {event.description}
                                </p>
                              )}

                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                  <Clock className="w-4 h-4" />
                                  <span>
                                    {event.start?.dateTime
                                      ? format(
                                          new Date(event.start.dateTime),
                                          "PPp"
                                        )
                                      : event.start?.date
                                      ? format(new Date(event.start.date), "PP")
                                      : "No start time"}
                                  </span>
                                </div>

                                {event.location && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <MapPin className="w-4 h-4" />
                                    <span>{event.location}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
