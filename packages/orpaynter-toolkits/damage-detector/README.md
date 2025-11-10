# 🔍 Real-Time Damage Detector Toolkit

**See damage as it happens with AI-powered real-time detection and AR visualization.**

## 🌟 Wow Features

### 1. Real-Time Video Analysis
Live damage detection from video streams:
- Process 30+ FPS for instant feedback
- Mobile device integration
- Drone footage analysis
- GoPro/action camera support

### 2. Multi-Type Damage Recognition
Detects 7 damage types automatically:
- 🌨️ Hail damage
- 💨 Wind damage
- 💥 Impact damage
- 🔧 Wear & tear
- 💧 Water leaks
- 🏚️ Structural issues
- 🌿 Biological growth

### 3. AR Overlay Visualization
See damage overlaid on real-world view:
- Color-coded severity indicators
- Instant cost estimates
- Tap-to-expand details
- Screenshot & share

### 4. Thermal Imaging Integration
Detect hidden problems:
- Heat loss detection
- Moisture intrusion
- Insulation gaps
- Active leaks

### 5. Before/After Comparison
Track repairs over time:
- Automated damage matching
- Progress visualization
- Quality assurance
- Client proof

## Installation

```bash
npm install @orpaynter/toolkit-damage-detector
```

## Quick Start

```typescript
import { createDamageDetector } from '@orpaynter/toolkit-damage-detector';

const detector = createDamageDetector({
  enableAR: true,
  enableThermal: true,
  confidenceThreshold: 0.8
});

// Analyze single image
const report = await detector.analyzeImage(imageData);

console.log(`Total damages: ${report.totalDamages}`);
console.log(`Overall: ${report.overallSeverity}`);
console.log(`Urgent repairs: ${report.urgentRepairs.length}`);
console.log(`Est. cost: $${report.estimatedRepairCost.avg.toLocaleString()}`);

// Check each damage
report.damages.forEach(damage => {
  console.log(`- ${damage.type}: ${damage.severity} (${damage.urgency})`);
  console.log(`  Cost: $${damage.repairCost.avg}`);
});
```

## Live Detection

```typescript
// Get video stream (web/mobile)
const stream = await navigator.mediaDevices.getUserMedia({ 
  video: { facingMode: 'environment' } 
});

// Start real-time detection
await detector.startLiveDetection(stream, {
  onDetection: (damage) => {
    // Show AR overlay
    showARAnnotation(damage);
    
    // Alert on urgent damage
    if (damage.urgency === 'immediate') {
      alert(`CRITICAL: ${damage.type} detected!`);
    }
  },
  onFrame: (annotatedFrame) => {
    // Update video display with annotations
    updateVideoDisplay(annotatedFrame);
  },
  onThermal: (anomaly) => {
    // Show thermal issue
    console.log(`Thermal: ${anomaly.type} (${anomaly.temperatureDelta}°F)`);
  }
});

// Stop when done
detector.stopLiveDetection();
```

## Thermal Analysis

```typescript
const anomalies = await detector.analyzeThermalImage(thermalData);

anomalies.forEach(anomaly => {
  console.log(`${anomaly.type}: ${anomaly.temperature}°F`);
  console.log(`Delta: ${anomaly.temperatureDelta}°F`);
  console.log(`Severity: ${anomaly.severity}`);
});
```

## Before/After Comparison

```typescript
const comparison = await detector.compareImages(
  beforeRepairImage,
  afterRepairImage
);

console.log(`New damages: ${comparison.newDamages.length}`);
console.log(`Repaired: ${comparison.repairedDamages.length}`);
console.log(`Unchanged: ${comparison.unchangedDamages.length}`);
```

## Export Reports

```typescript
const report = await detector.exportReport(damageReport, 'pdf');

console.log(`Report: ${report.url}`);
console.log(`ID: ${report.reportId}`);

// Email to client
await sendEmail({
  to: client.email,
  subject: 'Roof Inspection Report',
  attachment: report.url
});
```

## Damage Types Detected

| Type | Description | Typical Severity |
|------|-------------|------------------|
| Hail | Impact craters, granule loss | Moderate-Severe |
| Wind | Lifted shingles, missing tabs | Moderate-Critical |
| Impact | Punctures, cracks from debris | Severe-Critical |
| Wear | Aging, weathering, curling | Minor-Moderate |
| Leak | Water stains, rot | Moderate-Critical |
| Structural | Sagging, warping | Severe-Critical |
| Biological | Moss, algae, mold | Minor-Moderate |

## Severity Levels

- **Minor**: Cosmetic, low urgency
- **Moderate**: Functional concern, monitor
- **Severe**: Active degradation, repair soon
- **Critical**: Immediate safety/water risk

## Urgency Timeline

- **Immediate**: Fix within 24-48 hours
- **High**: Fix within 2 weeks
- **Medium**: Fix within 3 months
- **Low**: Fix within 12 months

## AR Features

### Color Coding
- 🔴 Red: Critical/Immediate
- 🟠 Orange: Severe/High
- 🟡 Yellow: Moderate/Medium
- 🟢 Green: Minor/Low

### Overlay Elements
- Bounding boxes around damage
- Confidence % display
- Cost estimate labels
- Urgency indicators
- Tap for details

## Use Cases

### 1. Initial Inspections
Walk the roof with phone/tablet, get instant assessment.

### 2. Storm Damage Assessment
After severe weather, quickly identify all damage for claims.

### 3. Quality Control
Verify repairs are complete before final payment.

### 4. Client Education
Show homeowners exactly what needs fixing and why.

### 5. Claims Documentation
Provide insurers with detailed, timestamped evidence.

## ROI Impact

**Traditional Inspection:**
- ⏱️ 30-60 minutes on roof
- 📝 Manual notes & photos
- 🤔 Easy to miss damage
- 💸 Callbacks for missed issues

**With Damage Detector:**
- ⚡ 10-15 minutes complete scan
- 🎯 Nothing missed by AI
- 📊 Instant detailed report
- 💰 Professional credibility

## Device Support

- 📱 iOS/Android phones
- 📱 Tablets
- 🚁 DJI drones (thermal models)
- 📷 GoPro cameras
- 🔥 FLIR thermal cameras

## Pricing

- **Basic**: $149/mo - Image analysis only
- **Pro**: $299/mo - +Live detection
- **Enterprise**: $599/mo - +Thermal, API access

## TypeScript Support

```typescript
import type {
  DamageDetection,
  ThermalAnomaly,
  DamageReport
} from '@orpaynter/toolkit-damage-detector';
```

## Support

- 📧 Email: toolkit-support@orpaynter.com
- 📚 Docs: https://orpaynter.com/toolkits/damage-detector
- 🎥 Video tutorials: https://orpaynter.com/tutorials

## License

MIT
