"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Plus, LogOut } from "lucide-react";
import { toast } from "sonner";

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
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
  });

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

  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

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

  useEffect(() => {
    if (session) {
      fetchEvents();
      setupWebhook(); // Setup webhook for real-time updates (works with ngrok HTTPS)
    }
  }, [session]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
          <CalendarIcon className="mx-auto h-12 w-12 text-blue-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Google Calendar Tracker
          </h1>
          <p className="text-gray-600 mb-6">
            Sign in with Google to view and manage your calendar events
          </p>
          <button
            onClick={() => signIn("google")}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-blue-500 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                Calendar Tracker
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Hello, {session.user?.name}
              </span>
              <button
                onClick={() => signOut()}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Your Events</h2>
          <div className="flex space-x-3">
            <button
              onClick={fetchEvents}
              disabled={loading}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              New Event
            </button>
          </div>
        </div>

        {showCreateForm && (
          <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Create New Event</h3>
            <form onSubmit={createEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={newEvent.title}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, title: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, description: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newEvent.startTime}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, startTime: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newEvent.endTime}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, endTime: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, location: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                >
                  Create Event
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md">
          {loading ? (
            <div className="p-8 text-center">
              <div className="text-gray-600">Loading events...</div>
            </div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-600">
                No events found. Create your first event!
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {events.map((event) => (
                <div key={event.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {event.summary || "Untitled Event"}
                      </h3>
                      {event.description && (
                        <p className="text-gray-600 mb-2">
                          {event.description}
                        </p>
                      )}
                      <div className="text-sm text-gray-500 space-y-1">
                        <div>
                          Start:{" "}
                          {event.start?.dateTime
                            ? format(new Date(event.start.dateTime), "PPp")
                            : event.start?.date
                            ? format(new Date(event.start.date), "PP")
                            : "No start time"}
                        </div>
                        <div>
                          End:{" "}
                          {event.end?.dateTime
                            ? format(new Date(event.end.dateTime), "PPp")
                            : event.end?.date
                            ? format(new Date(event.end.date), "PP")
                            : "No end time"}
                        </div>
                        {event.location && (
                          <div>Location: {event.location}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
