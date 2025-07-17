import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleCalendarService } from "@/lib/googleCalendar";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User";
import CalendarEventModel from "@/models/CalendarEvent";

export async function GET() {
  console.log("FETCH EVENTS STARTED");

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log("Unauthorized - no session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`Fetching events for user: ${session.user.email}`);

    await dbConnect();

    const user = await UserModel.findOne({ email: session.user.email });
    if (!user?.accessToken) {
      console.log("No access token found for user");
      return NextResponse.json({ error: "No access token" }, { status: 401 });
    }

    console.log("Fetching events from Google Calendar");
    const calendarService = new GoogleCalendarService(user.accessToken);
    const events = await calendarService.getEvents();
    console.log(`Fetched ${events.length} events from Google Calendar`);

    // Save events to database
    let savedCount = 0;
    for (const event of events) {
      if (event.id) {
        await CalendarEventModel.findOneAndUpdate(
          { googleEventId: event.id, userId: user._id },
          {
            googleEventId: event.id,
            userId: user._id,
            title: event.summary || "Untitled",
            description: event.description,
            startTime: new Date(
              event.start?.dateTime || event.start?.date || new Date()
            ),
            endTime: new Date(
              event.end?.dateTime || event.end?.date || new Date()
            ),
            location: event.location,
          },
          { upsert: true, new: true }
        );
        savedCount++;
      }
    }

    console.log(`Saved ${savedCount} events to database`);
    console.log("FETCH EVENTS COMPLETED");

    return NextResponse.json({ events });
  } catch (error) {
    console.error("FETCH EVENTS ERROR:", error);

    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log("CREATE EVENT STARTED");

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log("Unauthorized - no session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`Creating event for user: ${session.user.email}`);

    const body = await request.json();
    const { title, description, startTime, endTime, location } = body;

    console.log("Event details:", {
      title,
      description: description || "No description",
      startTime,
      endTime,
      location: location || "No location",
    });

    // Validate required fields
    if (!title || !startTime || !endTime) {
      console.log("Missing required fields");
      return NextResponse.json(
        { error: "Title, start time, and end time are required" },
        { status: 400 }
      );
    }

    // Convert datetime-local format to ISO string with timezone
    const startDateTime = new Date(startTime).toISOString();
    const endDateTime = new Date(endTime).toISOString();

    console.log("Converted times:", {
      startDateTime,
      endDateTime,
      timezone: "Asia/Kolkata",
    });

    await dbConnect();

    const user = await UserModel.findOne({ email: session.user.email });
    if (!user?.accessToken) {
      console.log("No access token found for user");
      return NextResponse.json({ error: "No access token" }, { status: 401 });
    }

    console.log("Creating event in Google Calendar");
    const calendarService = new GoogleCalendarService(user.accessToken);
    const event = await calendarService.createEvent({
      summary: title,
      description: description || undefined,
      start: {
        dateTime: startDateTime,
        timeZone: "Asia/Kolkata",
      },
      end: {
        dateTime: endDateTime,
        timeZone: "Asia/Kolkata",
      },
      location: location || undefined,
    });

    console.log(`Event created in Google Calendar with ID: ${event.id}`);

    // Save to database
    if (event.id) {
      await CalendarEventModel.create({
        googleEventId: event.id,
        userId: user._id,
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        location,
      });
      console.log("Event saved to database");
    }

    console.log("CREATE EVENT COMPLETED");
    return NextResponse.json({ event });
  } catch (error) {
    console.error("CREATE EVENT ERROR:", error);

    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  console.log("DELETE EVENT STARTED");

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log("Unauthorized - no session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      console.log("Missing event ID");
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    console.log(`Deleting event ${eventId} for user: ${session.user.email}`);

    await dbConnect();

    const user = await UserModel.findOne({ email: session.user.email });
    if (!user?.accessToken) {
      console.log("No access token found for user");
      return NextResponse.json({ error: "No access token" }, { status: 401 });
    }

    // Find the event in database
    const dbEvent = await CalendarEventModel.findOne({
      googleEventId: eventId,
      userId: user._id,
    });

    if (!dbEvent) {
      console.log(`Event ${eventId} not found in database`);
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    console.log("Deleting event from Google Calendar");
    const calendarService = new GoogleCalendarService(user.accessToken);
    await calendarService.deleteEvent(eventId);

    // Remove from database
    await CalendarEventModel.deleteOne({
      googleEventId: eventId,
      userId: user._id,
    });

    console.log(`Event ${eventId} deleted successfully`);
    console.log("DELETE EVENT COMPLETED");

    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("DELETE EVENT ERROR:", error);

    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
