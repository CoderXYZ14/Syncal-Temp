import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User";
import CalendarEventModel from "@/models/CalendarEvent";
import { GoogleCalendarService } from "@/lib/googleCalendar";

export async function POST(request: NextRequest) {
  try {
    // Verify the webhook
    const channelId = request.headers.get("x-goog-channel-id");
    const resourceState = request.headers.get("x-goog-resource-state");

    if (!channelId || !resourceState) {
      return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
    }

    console.log(
      `Webhook received: Channel ${channelId}, State ${resourceState}`
    );

    // Only process sync events (when calendar changes)
    if (resourceState === "sync") {
      await dbConnect();

      // Find user by webhook channel ID (we'll store this when setting up the webhook)
      const user = await UserModel.findOne({ webhookChannelId: channelId });

      if (!user || !user.accessToken) {
        console.log(`No user found for channel ${channelId}`);
        return NextResponse.json(
          { message: "User not found" },
          { status: 200 }
        );
      }

      // Fetch latest events from Google Calendar
      const calendarService = new GoogleCalendarService(user.accessToken);
      const events = await calendarService.getEvents();

      // Update database with latest events
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

      // TODO: In a real app, you'd notify the frontend via WebSocket or Server-Sent Events
      // For now, the frontend will get updates on next refresh

      console.log(`Updated events for user ${user.email}`);
    }

    return NextResponse.json({ message: "Webhook processed" }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// Handle webhook verification challenges
export async function GET(request: NextRequest) {
  const challenge = request.nextUrl.searchParams.get("hub.challenge");

  if (challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({ message: "Webhook endpoint" }, { status: 200 });
}
