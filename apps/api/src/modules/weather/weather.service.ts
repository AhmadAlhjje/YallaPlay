import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { createClient, RedisClientType } from 'redis';

export interface WeatherData {
  city: string;
  temperature: number;
  feelsLike: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  forecast: DayForecast[];
  fetchedAt: string;
}

export interface DayForecast {
  date: string;
  high: number;
  low: number;
  description: string;
  icon: string;
}

export interface HourlyEntry {
  time: string;
  temp: number;
  description: string;
  icon: string;
}

const CACHE_TTL_SECONDS = 3600; // 1 hour

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private redisClient: RedisClientType | null = null;

  constructor(private config: ConfigService) {
    this.initRedis();
  }

  private async initRedis(): Promise<void> {
    try {
      this.redisClient = createClient({
        socket: {
          host: this.config.get('REDIS_HOST', 'localhost'),
          port: parseInt(this.config.get('REDIS_PORT', '6379'), 10),
        },
        password: this.config.get('REDIS_PASSWORD') || undefined,
      }) as RedisClientType;

      await this.redisClient.connect();
      this.logger.log('Weather Redis cache connected');
    } catch (error) {
      this.logger.warn('Redis unavailable for weather cache — fetching live on every request');
      this.redisClient = null;
    }
  }

  async getCurrentWeather(latitude: number, longitude: number): Promise<WeatherData> {
    const cacheKey = `weather:current:${latitude.toFixed(2)}:${longitude.toFixed(2)}`;

    // 1. Try cache first
    const cached = await this.getFromCache(cacheKey);
    if (cached) return cached;

    // 2. Fetch from external API
    const apiKey = this.config.get('WEATHER_API_KEY');
    if (!apiKey) {
      return this.getMockWeather(); // Dev fallback
    }

    const baseUrl = this.config.get('WEATHER_API_URL');

    try {
      const [currentRes, forecastRes] = await Promise.all([
        axios.get(`${baseUrl}/weather`, {
          params: { lat: latitude, lon: longitude, appid: apiKey, units: 'metric', lang: 'ar' },
          timeout: 5000,
        }),
        axios.get(`${baseUrl}/forecast`, {
          params: {
            lat: latitude,
            lon: longitude,
            appid: apiKey,
            units: 'metric',
            lang: 'ar',
            cnt: 40, // 5 days × 8 readings per day
          },
          timeout: 5000,
        }),
      ]);

      const current = currentRes.data;
      const forecast = this.parseForecast(forecastRes.data.list);

      const weather: WeatherData = {
        city: current.name,
        temperature: Math.round(current.main.temp),
        feelsLike: Math.round(current.main.feels_like),
        description: current.weather[0].description,
        icon: current.weather[0].icon,
        humidity: current.main.humidity,
        windSpeed: Math.round(current.wind.speed * 3.6), // m/s → km/h
        forecast,
        fetchedAt: new Date().toISOString(),
      };

      await this.setCache(cacheKey, weather);
      return weather;
    } catch (error: any) {
      this.logger.error('Weather API error:', error.message);
      throw new ServiceUnavailableException('خدمة الطقس غير متاحة حالياً. حاول لاحقاً.');
    }
  }

  async getWeeklyForecast(latitude: number, longitude: number): Promise<DayForecast[]> {
    const weather = await this.getCurrentWeather(latitude, longitude);
    return weather.forecast;
  }

  async getHourlyForecast(latitude: number, longitude: number): Promise<HourlyEntry[]> {
    const cacheKey = `weather:hourly:${latitude.toFixed(2)}:${longitude.toFixed(2)}`;
    const cached = await this.getFromCache(cacheKey);
    if (cached) return cached as unknown as HourlyEntry[];

    const apiKey = this.config.get('WEATHER_API_KEY');
    if (!apiKey) return this.getMockHourly();

    const baseUrl = this.config.get('WEATHER_API_URL');
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await axios.get(`${baseUrl}/forecast`, {
        params: { lat: latitude, lon: longitude, appid: apiKey, units: 'metric', lang: 'ar', cnt: 9 },
        timeout: 5000,
      });

      const hourly: HourlyEntry[] = res.data.list
        .filter((item: any) => item.dt_txt.startsWith(today))
        .map((item: any) => ({
          time: item.dt_txt.split(' ')[1].slice(0, 5),
          temp: Math.round(item.main.temp),
          description: item.weather[0].description,
          icon: item.weather[0].icon,
        }));

      await this.setCache(cacheKey, hourly as any);
      return hourly;
    } catch (error: any) {
      this.logger.error('Hourly weather error:', error.message);
      return this.getMockHourly();
    }
  }

  private getMockHourly(): HourlyEntry[] {
    const now = new Date();
    return Array.from({ length: 8 }, (_, i) => {
      const h = (now.getHours() + i) % 24;
      return {
        time: `${String(h).padStart(2, '0')}:00`,
        temp: 28 + Math.round(Math.sin(i * 0.5) * 4),
        description: i < 3 ? 'صافٍ' : i < 6 ? 'غائم جزئياً' : 'صافٍ',
        icon: i < 12 ? '01d' : '01n',
      };
    });
  }

  private parseForecast(list: any[]): DayForecast[] {
    const byDay = new Map<string, any[]>();

    for (const item of list) {
      const date = item.dt_txt.split(' ')[0];
      if (!byDay.has(date)) byDay.set(date, []);
      byDay.get(date)!.push(item);
    }

    return Array.from(byDay.entries())
      .slice(0, 7) // 7 days
      .map(([date, items]) => ({
        date,
        high: Math.round(Math.max(...items.map((i) => i.main.temp_max))),
        low: Math.round(Math.min(...items.map((i) => i.main.temp_min))),
        description: items[Math.floor(items.length / 2)].weather[0].description,
        icon: items[Math.floor(items.length / 2)].weather[0].icon,
      }));
  }

  private async getFromCache(key: string): Promise<WeatherData | null> {
    if (!this.redisClient) return null;
    try {
      const raw = await this.redisClient.get(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private async setCache(key: string, data: WeatherData): Promise<void> {
    if (!this.redisClient) return;
    try {
      await this.redisClient.setEx(key, CACHE_TTL_SECONDS, JSON.stringify(data));
    } catch (error) {
      this.logger.warn('Failed to cache weather data:', error);
    }
  }

  private getMockWeather(): WeatherData {
    return {
      city: 'الرياض',
      temperature: 32,
      feelsLike: 35,
      description: 'صافٍ',
      icon: '01d',
      humidity: 25,
      windSpeed: 18,
      forecast: [
        { date: new Date().toISOString().split('T')[0], high: 34, low: 26, description: 'صافٍ', icon: '01d' },
      ],
      fetchedAt: new Date().toISOString(),
    };
  }
}
