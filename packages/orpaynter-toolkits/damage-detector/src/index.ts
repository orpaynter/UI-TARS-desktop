export interface DamageDetectorConfig {
  apiKey?: string;
  enableAR?: boolean;
  enableThermal?: boolean;
  confidenceThreshold?: number;
}

export interface DamageDetection {
  id: string;
  type: 'hail' | 'wind' | 'impact' | 'wear' | 'leak' | 'structural' | 'biological';
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  confidence: number;
  location: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  description: string;
  repairCost: {
    min: number;
    max: number;
    avg: number;
  };
  urgency: 'immediate' | 'high' | 'medium' | 'low';
}

export interface ThermalAnomaly {
  id: string;
  type: 'heat_loss' | 'moisture' | 'insulation_gap' | 'leak';
  temperature: number;
  temperatureDelta: number;
  location: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  severity: 'minor' | 'moderate' | 'severe';
}

export interface DamageReport {
  totalDamages: number;
  damages: DamageDetection[];
  thermalAnomalies?: ThermalAnomaly[];
  overallSeverity: 'good' | 'fair' | 'poor' | 'critical';
  estimatedRepairCost: {
    min: number;
    max: number;
    avg: number;
  };
  urgentRepairs: DamageDetection[];
  timeline: {
    immediate: number;
    thisMonth: number;
    thisQuarter: number;
    thisYear: number;
  };
  arAnnotations?: string; // Base64 annotated image
}

/**
 * Real-Time Damage Detector
 * 
 * Advanced damage detection toolkit with:
 * - Real-time video stream analysis
 * - Multi-type damage detection (hail, wind, impact, etc.)
 * - Thermal imaging integration
 * - AR overlay for instant visualization
 * - Automated severity assessment
 * - Cost estimation per damage
 * 
 * @example
 * ```typescript
 * const detector = new DamageDetector({
 *   enableAR: true,
 *   enableThermal: true,
 *   confidenceThreshold: 0.8
 * });
 * 
 * // Analyze single image
 * const report = await detector.analyzeImage(imageData);
 * console.log(`Found ${report.totalDamages} damages`);
 * console.log(`Urgent repairs: ${report.urgentRepairs.length}`);
 * 
 * // Start real-time detection
 * await detector.startLiveDetection(videoStream, {
 *   onDetection: (damage) => {
 *     console.log(`Detected: ${damage.type} (${damage.severity})`);
 *   }
 * });
 * ```
 */
export class DamageDetector {
  private config: Required<DamageDetectorConfig>;
  private isLiveDetecting = false;

  constructor(config: DamageDetectorConfig = {}) {
    this.config = {
      apiKey: config.apiKey || '',
      enableAR: config.enableAR ?? true,
      enableThermal: config.enableThermal ?? false,
      confidenceThreshold: config.confidenceThreshold || 0.75,
    };
  }

  /**
   * Analyze image for damage
   */
  async analyzeImage(imageData: string | Blob): Promise<DamageReport> {
    // In production, sends to ML model for analysis
    const damages = this.simulateDamageDetection();
    const thermalAnomalies = this.config.enableThermal 
      ? this.simulateThermalAnalysis() 
      : undefined;

    // Filter by confidence threshold
    const filteredDamages = damages.filter(
      d => d.confidence >= this.config.confidenceThreshold
    );

    // Calculate costs
    const totalCost = filteredDamages.reduce(
      (sum, d) => ({
        min: sum.min + d.repairCost.min,
        max: sum.max + d.repairCost.max,
        avg: sum.avg + d.repairCost.avg,
      }),
      { min: 0, max: 0, avg: 0 }
    );

    // Identify urgent repairs
    const urgentRepairs = filteredDamages.filter(
      d => d.urgency === 'immediate' || d.urgency === 'high'
    );

    // Calculate timeline
    const timeline = {
      immediate: filteredDamages.filter(d => d.urgency === 'immediate').length,
      thisMonth: filteredDamages.filter(d => d.urgency === 'high').length,
      thisQuarter: filteredDamages.filter(d => d.urgency === 'medium').length,
      thisYear: filteredDamages.filter(d => d.urgency === 'low').length,
    };

    // Overall severity
    const criticalCount = filteredDamages.filter(d => d.severity === 'critical').length;
    const severeCount = filteredDamages.filter(d => d.severity === 'severe').length;
    
    let overallSeverity: 'good' | 'fair' | 'poor' | 'critical';
    if (criticalCount > 0) overallSeverity = 'critical';
    else if (severeCount > 2) overallSeverity = 'poor';
    else if (severeCount > 0 || filteredDamages.length > 5) overallSeverity = 'fair';
    else overallSeverity = 'good';

    return {
      totalDamages: filteredDamages.length,
      damages: filteredDamages,
      thermalAnomalies,
      overallSeverity,
      estimatedRepairCost: totalCost,
      urgentRepairs,
      timeline,
      arAnnotations: this.config.enableAR ? 'base64_annotated_image' : undefined,
    };
  }

  /**
   * Start live video detection
   */
  async startLiveDetection(
    videoStream: MediaStream,
    callbacks: {
      onDetection?: (damage: DamageDetection) => void;
      onFrame?: (annotatedFrame: string) => void;
      onThermal?: (anomaly: ThermalAnomaly) => void;
    }
  ): Promise<void> {
    this.isLiveDetecting = true;

    // In production, processes video stream in real-time
    // This is a simulation
    const interval = setInterval(() => {
      if (!this.isLiveDetecting) {
        clearInterval(interval);
        return;
      }

      // Simulate detection
      if (Math.random() > 0.7 && callbacks.onDetection) {
        const damage = this.simulateDamageDetection()[0];
        if (damage.confidence >= this.config.confidenceThreshold) {
          callbacks.onDetection(damage);
        }
      }

      if (callbacks.onFrame) {
        callbacks.onFrame('base64_annotated_frame');
      }

      if (this.config.enableThermal && callbacks.onThermal && Math.random() > 0.8) {
        callbacks.onThermal(this.simulateThermalAnalysis()[0]);
      }
    }, 1000);
  }

  /**
   * Stop live detection
   */
  stopLiveDetection(): void {
    this.isLiveDetecting = false;
  }

  /**
   * Analyze thermal image
   */
  async analyzeThermalImage(thermalImageData: string): Promise<ThermalAnomaly[]> {
    return this.simulateThermalAnalysis();
  }

  /**
   * Compare before/after images
   */
  async compareImages(beforeImage: string, afterImage: string): Promise<{
    newDamages: DamageDetection[];
    repairedDamages: DamageDetection[];
    unchangedDamages: DamageDetection[];
  }> {
    const beforeReport = await this.analyzeImage(beforeImage);
    const afterReport = await this.analyzeImage(afterImage);

    // In production, uses ML to match damages across images
    return {
      newDamages: afterReport.damages.slice(0, 2),
      repairedDamages: beforeReport.damages.slice(0, 1),
      unchangedDamages: beforeReport.damages.slice(1),
    };
  }

  /**
   * Generate AR overlay
   */
  async generateAROverlay(imageData: string, damages: DamageDetection[]): Promise<string> {
    // In production, generates AR annotations
    return 'base64_ar_annotated_image';
  }

  /**
   * Export detailed report
   */
  async exportReport(report: DamageReport, format: 'pdf' | 'json' | 'excel'): Promise<{
    url: string;
    reportId: string;
  }> {
    return {
      url: `https://example.com/reports/${Date.now()}.${format}`,
      reportId: `RPT-${Date.now()}`,
    };
  }

  /**
   * Simulate damage detection (for demo)
   */
  private simulateDamageDetection(): DamageDetection[] {
    const damageTypes: Array<DamageDetection['type']> = [
      'hail', 'wind', 'impact', 'wear', 'leak', 'structural', 'biological'
    ];
    const severities: Array<DamageDetection['severity']> = [
      'minor', 'moderate', 'severe', 'critical'
    ];
    const urgencies: Array<DamageDetection['urgency']> = [
      'immediate', 'high', 'medium', 'low'
    ];

    const count = Math.floor(3 + Math.random() * 7);
    const damages: DamageDetection[] = [];

    for (let i = 0; i < count; i++) {
      const type = damageTypes[Math.floor(Math.random() * damageTypes.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const urgency = urgencies[Math.floor(Math.random() * urgencies.length)];
      
      const baseCost = severity === 'critical' ? 2000 :
                       severity === 'severe' ? 1000 :
                       severity === 'moderate' ? 500 : 200;

      damages.push({
        id: `DMG-${Date.now()}-${i}`,
        type,
        severity,
        confidence: 0.75 + Math.random() * 0.24,
        location: {
          x: Math.random() * 800,
          y: Math.random() * 600,
          width: 50 + Math.random() * 100,
          height: 50 + Math.random() * 100,
        },
        description: `${severity} ${type} damage detected`,
        repairCost: {
          min: baseCost * 0.8,
          max: baseCost * 1.3,
          avg: baseCost,
        },
        urgency,
      });
    }

    return damages;
  }

  /**
   * Simulate thermal analysis (for demo)
   */
  private simulateThermalAnalysis(): ThermalAnomaly[] {
    const types: Array<ThermalAnomaly['type']> = [
      'heat_loss', 'moisture', 'insulation_gap', 'leak'
    ];
    const count = Math.floor(2 + Math.random() * 4);
    const anomalies: ThermalAnomaly[] = [];

    for (let i = 0; i < count; i++) {
      anomalies.push({
        id: `THERM-${Date.now()}-${i}`,
        type: types[Math.floor(Math.random() * types.length)],
        temperature: 60 + Math.random() * 40,
        temperatureDelta: 5 + Math.random() * 15,
        location: {
          x: Math.random() * 800,
          y: Math.random() * 600,
          width: 100 + Math.random() * 150,
          height: 100 + Math.random() * 150,
        },
        severity: Math.random() > 0.7 ? 'severe' : Math.random() > 0.4 ? 'moderate' : 'minor',
      });
    }

    return anomalies;
  }
}

/**
 * Create Damage Detector instance
 */
export function createDamageDetector(config?: DamageDetectorConfig): DamageDetector {
  return new DamageDetector(config);
}
