# 🤖 Contractor Copilot Toolkit

**Your AI business partner that handles scheduling, follow-ups, and optimization.**

## 🌟 Wow Features

1. **Voice Commands** - "Schedule inspection tomorrow at 10am" - Done!
2. **Auto-Scheduling** - AI optimizes crew assignments & routes
3. **Smart Follow-ups** - Automated lead nurturing
4. **Performance Analytics** - Real-time business insights
5. **Churn Prevention** - Predict & prevent customer loss

## Quick Start

```typescript
import { createContractorCopilot } from '@orpaynter/toolkit-contractor-copilot';

const copilot = createContractorCopilot({
  voiceEnabled: true,
  autoSchedule: true
});

// Voice command
const result = await copilot.processVoiceCommand(audioData);
console.log(result.result.message); // "Schedule inspection - Done!"

// Optimize schedule
const schedule = await copilot.optimizeSchedule(projects);
console.log(`Efficiency: ${schedule.efficiency * 100}%`);

// Auto follow-up
const followUp = await copilot.autoFollowUp('lead-123');
console.log(`Sent via ${followUp.channel}`);

// Performance insights
const perf = await copilot.analyzePerformance();
console.log(`Revenue/day: $${perf.revenuePerDay.toFixed(0)}`);
perf.insights.forEach(i => console.log(`- ${i}`));
```

## Voice Commands

- "Show my schedule"
- "Schedule [address] [date] [time]"
- "Order [quantity] [material]"
- "Send estimate to [email]"
- "What projects are behind?"
- "Call [customer name]"
- "Track crew location"

## Auto-Scheduling

The AI considers:
- Weather forecasts
- Crew availability
- Drive time/routes
- Material availability
- Customer preferences
- Profit optimization

## Auto Follow-Ups

Trigger-based messaging:
- 3 days after quote
- 1 week after inspection
- Post-job satisfaction
- Seasonal maintenance
- Referral requests

## Analytics Dashboard

Track:
- Efficiency score
- On-time completion %
- Customer satisfaction
- Revenue per day
- Crew performance
- Material waste
- Lead conversion

## Features

- 📞 Voice commands
- 📅 Smart scheduling
- ✉️ Auto follow-ups
- 📊 Performance analytics
- 🎯 Lead scoring
- 🚨 Churn prevention
- 🗺️ Route optimization
- 💰 Price optimization

## ROI Impact

**Without Copilot:**
- ⏱️ 10+ hrs/week on scheduling
- 📉 40% lead follow-up rate
- 😓 Manual everything

**With Copilot:**
- ⚡ Automated scheduling
- 📈 95% lead follow-up rate
- 🚀 3x productivity
- 💰 20% revenue increase

## Pricing

- **Solo**: $149/mo - 1 user
- **Team**: $299/mo - 5 users
- **Enterprise**: Custom - Unlimited

## TypeScript Support

```typescript
import type {
  Project,
  AITask,
  CopilotConfig
} from '@orpaynter/toolkit-contractor-copilot';
```

## Support

- 📧 Email: toolkit-support@orpaynter.com
- 📚 Docs: https://orpaynter.com/toolkits/copilot
- 🎓 Training: https://orpaynter.com/copilot-training

License: MIT
