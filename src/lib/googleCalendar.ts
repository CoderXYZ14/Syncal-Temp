import { google } from "googleapis";

export class GoogleCalendarService {
  private calendar;

  constructor(accessToken: string) {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    this.calendar = google.calendar({ version: "v3", auth: oauth2Client });
  }

  async getEvents() {
    try {
      console.log("Fetching events from Google Calendar API");
      const response = await this.calendar.events.list({
        calendarId: "primary",
        timeMin: new Date().toISOString(),
        maxResults: 50,
        singleEvents: true,
        orderBy: "startTime",
      });

      const events = response.data.items || [];
      console.log(`Google Calendar API returned ${events.length} events`);
      return events;
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      throw error;
    }
  }

  async createEvent(event: {
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone?: string };
    end: { dateTime: string; timeZone?: string };
    location?: string;
  }) {
    try {
      console.log("Creating event in Google Calendar API");
      const response = await this.calendar.events.insert({
        calendarId: "primary",
        requestBody: event,
      });

      console.log(`Event created with ID: ${response.data.id}`);
      return response.data;
    } catch (error) {
      console.error("Error creating calendar event:", error);
      throw error;
    }
  }

  async updateEvent(
    eventId: string,
    event: {
      summary?: string;
      description?: string;
      start?: { dateTime: string };
      end?: { dateTime: string };
      location?: string;
    }
  ) {
    try {
      console.log(`Updating event ${eventId} in Google Calendar API`);
      const response = await this.calendar.events.update({
        calendarId: "primary",
        eventId,
        requestBody: event,
      });

      console.log(`Event updated: ${eventId}`);
      return response.data;
    } catch (error) {
      console.error("Error updating calendar event:", error);
      throw error;
    }
  }

  async deleteEvent(eventId: string) {
    try {
      console.log(`Deleting event ${eventId} from Google Calendar API`);
      await this.calendar.events.delete({
        calendarId: "primary",
        eventId,
      });
      console.log(`Event deleted: ${eventId}`);
    } catch (error) {
      console.error("Error deleting calendar event:", error);
      throw error;
    }
  }

  async setupWebhook(webhookUrl: string) {
    try {
      const channelId = `channel-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      console.log(`Setting up webhook with channel ID: ${channelId}`);
      console.log(`Webhook URL: ${webhookUrl}`);

      const response = await this.calendar.events.watch({
        calendarId: "primary",
        requestBody: {
          id: channelId,
          type: "web_hook",
          address: webhookUrl,
          // Set expiration (max 1 week for calendar API)
          expiration: (Date.now() + 7 * 24 * 60 * 60 * 1000).toString(),
        },
      });

      const result = {
        channelId: response.data.id,
        resourceId: response.data.resourceId,
        expiration: response.data.expiration,
      };

      console.log("Webhook setup successful:", result);
      return result;
    } catch (error) {
      console.error("Error setting up webhook:", error);
      throw error;
    }
  }

  async stopWebhook(channelId: string, resourceId: string) {
    try {
      console.log(
        `Stopping webhook - Channel: ${channelId}, Resource: ${resourceId}`
      );

      await this.calendar.channels.stop({
        requestBody: {
          id: channelId,
          resourceId: resourceId,
        },
      });

      console.log(`Webhook stopped successfully`);
    } catch (error) {
      console.error("Error stopping webhook:", error);
      throw error;
    }
  }
}
