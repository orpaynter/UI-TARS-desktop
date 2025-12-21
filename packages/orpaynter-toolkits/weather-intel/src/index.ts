export interface WeatherIntelConfig {
  apiKey?: string;
  location?: { lat: number; lon: number };
}

export interface StormPrediction {
  id: string;
  type: 'hail' | 'wind' | 'tornado' | 'hurricane';
  probability: number;
  arrivalTime: string;
  duration: number;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  damageRisk: {
    roofing: number;
    siding: number;
    windows: number;
  };
  recommendedActions: string[];
}

export interface WorkWindow {
  start: string;
  end: string;
  duration: number;
  conditions: 'ideal' | 'good' | 'marginal' | 'poor';
  temperature: number;
  windSpeed: number;
  precipitation: number;
  uvIndex: number;
}

export class WeatherIntel {
  private config: Required<WeatherIntelConfig>;

  constructor(config: WeatherIntelConfig = {}) {
    this.config = {
      apiKey: config.apiKey || '',
      location: config.location || { lat: 40.7128, lon: -74.0060 },
    };
  }

  async predictStorms(days: number = 7): Promise<StormPrediction[]> {
    const storms: StormPrediction[] = [];
    const now = Date.now();
    
    for (let i = 0; i < Math.floor(Math.random() * 3); i++) {
      storms.push({
        id: `STORM-${now}-${i}`,
        type: ['hail', 'wind', 'tornado', 'hurricane'][Math.floor(Math.random() * 4)] as any,
        probability: 0.3 + Math.random() * 0.6,
        arrivalTime: new Date(now + (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
        duration: 2 + Math.random() * 6,
        severity: ['minor', 'moderate', 'severe', 'extreme'][Math.floor(Math.random() * 4)] as any,
        damageRisk: {
          roofing: Math.random(),
          siding: Math.random(),
          windows: Math.random(),
        },
        recommendedActions: [
          'Secure loose materials',
          'Check roof fasteners',
          'Clear gutters and drains',
        ],
      });
    }
    
    return storms;
  }

  async findWorkWindows(days: number = 7): Promise<WorkWindow[]> {
    const windows: WorkWindow[] = [];
    const now = Date.now();
    
    for (let i = 0; i < days * 2; i++) {
      const start = new Date(now + i * 4 * 60 * 60 * 1000);
      windows.push({
        start: start.toISOString(),
        end: new Date(start.getTime() + 4 * 60 * 60 * 1000).toISOString(),
        duration: 4,
        conditions: ['ideal', 'good', 'marginal', 'poor'][Math.floor(Math.random() * 4)] as any,
        temperature: 60 + Math.random() * 30,
        windSpeed: Math.random() * 20,
        precipitation: Math.random() * 0.5,
        uvIndex: Math.floor(Math.random() * 11),
      });
    }
    
    return windows.filter(w => w.conditions === 'ideal' || w.conditions === 'good');
  }

  async analyzeClimateRisk(zipCode: string): Promise<{
    hailRisk: number;
    windRisk: number;
    hurricaneRisk: number;
    overallRisk: 'low' | 'moderate' | 'high' | 'extreme';
    insuranceFactor: number;
  }> {
    return {
      hailRisk: Math.random(),
      windRisk: Math.random(),
      hurricaneRisk: Math.random(),
      overallRisk: ['low', 'moderate', 'high', 'extreme'][Math.floor(Math.random() * 4)] as any,
      insuranceFactor: 1 + Math.random() * 0.5,
    };
  }
}

export function createWeatherIntel(config?: WeatherIntelConfig): WeatherIntel {
  return new WeatherIntel(config);
}
