import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Progress } from '../ui/progress';

interface FirstRunWizardProps {
  onComplete: (config: OrPaynterConfig) => void;
  onSkip: () => void;
}

interface OrPaynterConfig {
  demoMode: boolean;
  apiBase?: string;
  token?: string;
  environment: 'development' | 'staging' | 'production';
  enableAI: boolean;
  enableClaims: boolean;
  openaiKey?: string;
  stripeKey?: string;
}

export type { OrPaynterConfig };

export const FirstRunWizard: React.FC<FirstRunWizardProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [config, setConfig] = useState<OrPaynterConfig>({
    demoMode: true,
    environment: 'development',
    enableAI: true,
    enableClaims: true,
  });

  const steps = [
    'Welcome',
    'Mode Selection',
    'API Configuration',
    'Features',
    'External Services',
    'Complete'
  ];

  const totalSteps = steps.length;
  const progressPercent = ((currentStep + 1) / totalSteps) * 100;

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete(config);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Welcome to OrPaynter</h2>
              <p className="text-gray-300 mb-6">
                OrPaynter is an AI-powered roofing inspection and claims processing platform.
                Let's get you set up to start analyzing roof damage and processing insurance claims.
              </p>
              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-300 mb-2">What OrPaynter Can Do:</h3>
                <ul className="text-left text-gray-300 space-y-2">
                  <li>• AI-powered roof damage detection from photos</li>
                  <li>• Automated insurance claim generation</li>
                  <li>• Cost estimation and repair recommendations</li>
                  <li>• Contractor matching and scheduling</li>
                  <li>• Comprehensive damage reporting</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Choose Your Mode</h2>
            <RadioGroup
              value={config.demoMode ? 'demo' : 'production'}
              onValueChange={(value) => setConfig({ ...config, demoMode: value === 'demo' })}
            >
              <div className="space-y-4">
                <div className="border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="demo" id="demo" />
                    <Label htmlFor="demo" className="text-white font-medium">Demo Mode</Label>
                  </div>
                  <p className="text-gray-400 text-sm mt-2 ml-6">
                    Perfect for testing and evaluation. Uses mock data and responses.
                    No API keys required - get started immediately!
                  </p>
                </div>
                <div className="border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="production" id="production" />
                    <Label htmlFor="production" className="text-white font-medium">Production Mode</Label>
                  </div>
                  <p className="text-gray-400 text-sm mt-2 ml-6">
                    Connect to your OrPaynter API for real data processing.
                    Requires valid API credentials and configuration.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">API Configuration</h2>
            {config.demoMode ? (
              <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
                <p className="text-green-300">
                  🎉 Demo mode selected! No API configuration needed. 
                  You can skip this step and start using OrPaynter right away.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="apiBase" className="text-white">API Base URL</Label>
                  <Input
                    id="apiBase"
                    type="url"
                    placeholder="https://api.orpaynter.com"
                    value={config.apiBase || ''}
                    onChange={(e) => setConfig({ ...config, apiBase: e.target.value })}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="token" className="text-white">API Token</Label>
                  <Input
                    id="token"
                    type="password"
                    placeholder="Your OrPaynter API token"
                    value={config.token || ''}
                    onChange={(e) => setConfig({ ...config, token: e.target.value })}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Environment</Label>
                  <RadioGroup
                    value={config.environment}
                    onValueChange={(value) => setConfig({ ...config, environment: value as 'development' | 'staging' | 'production' })}
                  >
                    <div className="flex space-x-6 mt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="development" id="dev" />
                        <Label htmlFor="dev" className="text-gray-300">Development</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="staging" id="staging" />
                        <Label htmlFor="staging" className="text-gray-300">Staging</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="production" id="prod" />
                        <Label htmlFor="prod" className="text-gray-300">Production</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Feature Selection</h2>
            <p className="text-gray-300 mb-4">Choose which OrPaynter features you'd like to enable:</p>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enableAI"
                  checked={config.enableAI}
                  onCheckedChange={(checked) => setConfig({ ...config, enableAI: checked as boolean })}
                />
                <Label htmlFor="enableAI" className="text-white">
                  AI-Powered Analysis
                </Label>
              </div>
              <p className="text-gray-400 text-sm ml-6">
                Enable photo analysis, damage detection, and automated cost estimation.
              </p>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enableClaims"
                  checked={config.enableClaims}
                  onCheckedChange={(checked) => setConfig({ ...config, enableClaims: checked as boolean })}
                />
                <Label htmlFor="enableClaims" className="text-white">
                  Claims Processing
                </Label>
              </div>
              <p className="text-gray-400 text-sm ml-6">
                Enable insurance claim submission and tracking capabilities.
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">External Services</h2>
            <p className="text-gray-300 mb-4">
              Configure optional external services for enhanced functionality:
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="openaiKey" className="text-white">OpenAI API Key (Optional)</Label>
                <Input
                  id="openaiKey"
                  type="password"
                  placeholder="sk-..."
                  value={config.openaiKey || ''}
                  onChange={(e) => setConfig({ ...config, openaiKey: e.target.value })}
                  className="bg-gray-800 border-gray-600 text-white"
                />
                <p className="text-gray-400 text-xs mt-1">For enhanced AI analysis capabilities</p>
              </div>
              <div>
                <Label htmlFor="stripeKey" className="text-white">Stripe API Key (Optional)</Label>
                <Input
                  id="stripeKey"
                  type="password"
                  placeholder="pk_..."
                  value={config.stripeKey || ''}
                  onChange={(e) => setConfig({ ...config, stripeKey: e.target.value })}
                  className="bg-gray-800 border-gray-600 text-white"
                />
                <p className="text-gray-400 text-xs mt-1">For payment processing integration</p>
              </div>
            </div>
            <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 mt-4">
              <p className="text-yellow-300 text-sm">
                💡 These services are optional and can be configured later in settings.
              </p>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Setup Complete! 🎉</h2>
              <p className="text-gray-300 mb-6">
                OrPaynter is now configured and ready to use. Here's what you can do next:
              </p>
              <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 text-left">
                <h3 className="text-lg font-semibold text-white mb-3">Configuration Summary:</h3>
                <ul className="text-gray-300 space-y-1">
                  <li>• Mode: {config.demoMode ? 'Demo' : 'Production'}</li>
                  <li>• AI Analysis: {config.enableAI ? 'Enabled' : 'Disabled'}</li>
                  <li>• Claims Processing: {config.enableClaims ? 'Enabled' : 'Disabled'}</li>
                  <li>• Environment: {config.environment}</li>
                  {!config.demoMode && config.apiBase && <li>• API: {config.apiBase}</li>}
                </ul>
              </div>
              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mt-4">
                <h3 className="text-lg font-semibold text-blue-300 mb-2">Quick Start Tips:</h3>
                <ul className="text-left text-gray-300 space-y-1">
                  <li>• Upload roof photos to get AI damage analysis</li>
                  <li>• Submit claims directly from analysis results</li>
                  <li>• Access all features from the OrPaynter menu</li>
                  <li>• Check settings to modify configuration anytime</li>
                </ul>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 bg-gray-900 border-gray-700">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">OP</span>
              </div>
              <CardTitle className="text-xl text-white">OrPaynter Setup</CardTitle>
            </div>
            <Button variant="ghost" onClick={onSkip} className="text-gray-400 hover:text-white">
              Skip Setup
            </Button>
          </div>
          <CardDescription className="text-gray-400">
            Step {currentStep + 1} of {totalSteps}: {steps[currentStep]}
          </CardDescription>
          <Progress value={progressPercent} className="mt-2" />
        </CardHeader>
        
        <CardContent className="py-6">
          {renderStepContent()}
        </CardContent>

        <CardFooter className="flex justify-between pt-4 border-t border-gray-700">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Previous
          </Button>
          
          <div className="flex space-x-2">
            {currentStep === totalSteps - 1 ? (
              <Button onClick={handleComplete} className="bg-blue-600 hover:bg-blue-700">
                Complete Setup
              </Button>
            ) : (
              <Button onClick={nextStep} className="bg-blue-600 hover:bg-blue-700">
                Next
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};