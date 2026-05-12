import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { WeatherService, WeatherData, DayForecast, HourlyEntry } from './weather.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Weather')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get('current')
  @ApiOperation({ summary: 'Current weather + 7-day forecast (1hr Redis cache)' })
  @ApiQuery({ name: 'lat', description: 'Latitude', type: Number })
  @ApiQuery({ name: 'lon', description: 'Longitude', type: Number })
  getCurrent(@Query('lat') lat: string, @Query('lon') lon: string): Promise<WeatherData> {
    return this.weatherService.getCurrentWeather(parseFloat(lat), parseFloat(lon));
  }

  @Get('forecast')
  @ApiOperation({ summary: '7-day forecast only' })
  getForecast(@Query('lat') lat: string, @Query('lon') lon: string): Promise<DayForecast[]> {
    return this.weatherService.getWeeklyForecast(parseFloat(lat), parseFloat(lon));
  }

  @Get('hourly')
  @ApiOperation({ summary: "Today's hourly forecast (3-hour intervals)" })
  getHourly(@Query('lat') lat: string, @Query('lon') lon: string): Promise<HourlyEntry[]> {
    return this.weatherService.getHourlyForecast(parseFloat(lat), parseFloat(lon));
  }
}
