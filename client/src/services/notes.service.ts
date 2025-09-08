import { API_ENDPOINTS } from "../config/api";

class NotesService {
  async trackView(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_ENDPOINTS.notes}/${id}/view`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to track view");
      }
    } catch (error) {
      console.error("Error tracking view:", error);
      throw error;
    }
  }
}

export const notesService = new NotesService();
