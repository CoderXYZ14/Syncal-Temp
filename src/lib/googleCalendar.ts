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
      const response = await this.calendar.events.list({
        calendarId: "primary",
        timeMin: new Date().toISOString(),
        maxResults: 50,
        singleEvents: true,
        orderBy: "startTime",
      });

      return response.data.items || [];
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
      const response = await this.calendar.events.insert({
        calendarId: "primary",
        requestBody: event,
      });

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
      const response = await this.calendar.events.update({
        calendarId: "primary",
        eventId,
        requestBody: event,
      });

      return response.data;
    } catch (error) {
      console.error("Error updating calendar event:", error);
      throw error;
    }
  }

  async deleteEvent(eventId: string) {
    try {
      await this.calendar.events.delete({
        calendarId: "primary",
        eventId,
      });
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

      const response = await this.calendar.events.watch({
        calendarId: "primary",
        requestBody: {
          id: channelId,
          type: "web_hook",
          address: webhookUrl,
          // Optional: Set expiration (max 1 week for calendar API)
          expiration: (Date.now() + 7 * 24 * 60 * 60 * 1000).toString(),
        },
      });

      return {
        channelId: response.data.id,
        resourceId: response.data.resourceId,
        expiration: response.data.expiration,
      };
    } catch (error) {
      console.error("Error setting up webhook:", error);
      throw error;
    }
  }

  async stopWebhook(channelId: string, resourceId: string) {
    try {
      await this.calendar.channels.stop({
        requestBody: {
          id: channelId,
          resourceId: resourceId,
        },
      });
    } catch (error) {
      console.error("Error stopping webhook:", error);
      throw error;
    }
  }
}
