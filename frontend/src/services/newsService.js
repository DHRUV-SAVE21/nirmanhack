import { apiClient } from '../config/api';

export const newsService = {
  /**
   * Fetch news from the backend with pagination and optional location/coords
   */
  getNews: async ({ page = 1, limit = 8, location = '', latitude = null, longitude = null, lang = 'en' }) => {
    try {
      const params = { page, limit, lang };
      if (location) params.location = location;
      if (latitude) params.latitude = latitude;
      if (longitude) params.longitude = longitude;

      const response = await apiClient.get('/api/news/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching news:', error);
      throw error;
    }
  },

  /**
   * Trigger a fresh fetch from GNews API
   */
  fetchFreshNews: async (location = 'India', lang = 'en') => {
    try {
      const response = await apiClient.post('/api/news/fetch-news', { location, lang });
      return response.data;
    } catch (error) {
      console.error('Error triggering news fetch:', error);
      throw error;
    }
  }
};
