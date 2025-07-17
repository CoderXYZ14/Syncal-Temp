import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleCalendarService } from "@/lib/googleCalendar";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User";

export async function POST() {
  console.log("WEBHOOK SETUP STARTED");

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log("Unauthorized - no session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`Setting up webhook for user: ${session.user.email}`);

    await dbConnect();

    const user = await UserModel.findOne({ email: session.user.email });
    if (!user?.accessToken) {
      console.log("No access token found for user");
      return NextResponse.json({ error: "No access token" }, { status: 401 });
    }

    const calendarService = new GoogleCalendarService(user.accessToken);

    // Setup webhook
    const webhookUrl = `${process.env.NEXTAUTH_URL}/api/webhook/calendar`;
    console.log(`Webhook URL: ${webhookUrl}`);

    const webhook = await calendarService.setupWebhook(webhookUrl);
    console.log("Webhook created:", {
      channelId: webhook.channelId,
      resourceId: webhook.resourceId,
      expiration: webhook.expiration
        ? new Date(parseInt(webhook.expiration)).toISOString()
        : "No expiration",
    });

    // Stop existing webhook if any
    if (user.webhookChannelId && user.webhookResourceId) {
      console.log(`Stopping existing webhook: ${user.webhookChannelId}`);
      try {
        await calendarService.stopWebhook(
          user.webhookChannelId,
          user.webhookResourceId
        );
        console.log("Existing webhook stopped successfully");
      } catch (error) {
        console.log("Failed to stop existing webhook:", error);
      }
    }

    // Save webhook info to user
    user.webhookChannelId = webhook.channelId || undefined;
    user.webhookResourceId = webhook.resourceId || undefined;
    await user.save();

    console.log("Webhook info saved to database");
    console.log("WEBHOOK SETUP COMPLETED");

    return NextResponse.json({
      message: "Webhook setup successfully",
      channelId: webhook.channelId,
      expiration: webhook.expiration,
    });
  } catch (error) {
    console.error("WEBHOOK SETUP ERROR:", error);

    return NextResponse.json(
      { error: "Failed to setup webhook" },
      { status: 500 }
    );
  }
}
