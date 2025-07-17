import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User";
import CalendarEventModel from "@/models/CalendarEvent";
import { GoogleCalendarService } from "@/lib/googleCalendar";

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString();
  console.log(`WEBHOOK RECEIVED [${timestamp}]`);

  try {
    // Extract webhook headers
    const headers = {
      channelId: request.headers.get("x-goog-channel-id"),
      resourceState: request.headers.get("x-goog-resource-state"),
      resourceId: request.headers.get("x-goog-resource-id"),
      resourceUri: request.headers.get("x-goog-resource-uri"),
      messageNumber: request.headers.get("x-goog-message-number"),
      changed: request.headers.get("x-goog-changed"),
    };

    console.log("Webhook Headers:", JSON.stringify(headers, null, 2));

    // Basic validation
    if (!headers.channelId || !headers.resourceState) {
      console.log("Invalid webhook - missing required headers");
      return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
    }

    console.log(`Webhook Type: ${headers.resourceState}`);

    // Only process sync events (when calendar changes)
    if (headers.resourceState === "sync") {
      console.log("Processing sync event");

      await dbConnect();

      // Find user by webhook channel ID
      const user = await UserModel.findOne({
        webhookChannelId: headers.channelId,
      });

      if (!user) {
        console.log(`No user found for channel: ${headers.channelId}`);
        return NextResponse.json(
          { message: "User not found" },
          { status: 200 }
        );
      }

      if (!user.accessToken) {
        console.log(`No access token for user: ${user.email}`);
        return NextResponse.json(
          { message: "No access token" },
          { status: 200 }
        );
      }

      console.log(`Processing webhook for user: ${user.email}`);

      // Fetch latest events from Google Calendar
      const calendarService = new GoogleCalendarService(user.accessToken);
      const events = await calendarService.getEvents();
      console.log(`Fetched ${events.length} events from Google Calendar`);

      // Update database with latest events
      let updatedCount = 0;
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
          updatedCount++;
        }
      }

      console.log(
        `Updated ${updatedCount} events in database for user: ${user.email}`
      );
    } else {
      console.log(`Ignoring webhook state: ${headers.resourceState}`);
    }

    console.log("Webhook processed successfully");
    return NextResponse.json({ message: "Webhook processed" }, { status: 200 });
  } catch (error) {
    console.error("WEBHOOK ERROR:", error);

    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// Handle webhook verification challenges
export async function GET(request: NextRequest) {
  const challenge = request.nextUrl.searchParams.get("hub.challenge");
  console.log(`Webhook verification challenge: ${challenge}`);

  if (challenge) {
    console.log("Responding to webhook verification challenge");
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  console.log("Webhook endpoint accessed without challenge");
  return NextResponse.json({ message: "Webhook endpoint" }, { status: 200 });
}
