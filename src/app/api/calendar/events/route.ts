import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleCalendarService } from "@/lib/googleCalendar";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User";
import CalendarEventModel from "@/models/CalendarEvent";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user?.accessToken) {
      return NextResponse.json({ error: "No access token" }, { status: 401 });
    }

    const calendarService = new GoogleCalendarService(user.accessToken);
    const events = await calendarService.getEvents();

    // Save events to database
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
      }
    }

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, startTime, endTime, location } = body;

    await dbConnect();
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user?.accessToken) {
      return NextResponse.json({ error: "No access token" }, { status: 401 });
    }

    const calendarService = new GoogleCalendarService(user.accessToken);
    const event = await calendarService.createEvent({
      summary: title,
      description,
      start: { dateTime: startTime },
      end: { dateTime: endTime },
      location,
    });

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
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
