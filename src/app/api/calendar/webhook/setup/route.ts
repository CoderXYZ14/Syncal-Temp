import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleCalendarService } from "@/lib/googleCalendar";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User";

export async function POST() {
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

    // Setup webhook
    const webhookUrl = `${process.env.NEXTAUTH_URL}/api/webhook/calendar`;
    const webhook = await calendarService.setupWebhook(webhookUrl);

    // Stop existing webhook if any
    if (user.webhookChannelId && user.webhookResourceId) {
      try {
        await calendarService.stopWebhook(
          user.webhookChannelId,
          user.webhookResourceId
        );
      } catch (error) {
        console.log("Failed to stop existing webhook:", error);
      }
    }

    // Save webhook info to user
    user.webhookChannelId = webhook.channelId || undefined;
    user.webhookResourceId = webhook.resourceId || undefined;
    await user.save();

    return NextResponse.json({
      message: "Webhook setup successfully",
      channelId: webhook.channelId,
      expiration: webhook.expiration,
    });
  } catch (error) {
    console.error("Error setting up webhook:", error);
    return NextResponse.json(
      { error: "Failed to setup webhook" },
      { status: 500 }
    );
  }
}
