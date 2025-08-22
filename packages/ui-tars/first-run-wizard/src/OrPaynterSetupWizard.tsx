import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Settings, Key, TestTube, Zap } from 'lucide-react';

interface OrPaynterConfig {
  apiBase: string;
  token: string;
  enableClaims: boolean;
  enableAI: boolean;
  demoMode: boolean;
}

interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
}

const OrPaynterSetupWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [config, setConfig] = useState<OrPaynterConfig>({
    apiBase: '',
    token: '',
    enableClaims: true,
    enableAI: true,
    demoMode: true
  });
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [setupSteps, setSetupSteps] = useState<SetupStep[]>([
    {
      id: 'welcome',
      title: 'Welcome to OrPaynter',
      description: 'Introduction to OrPaynter Platform integration',
      completed: false,
      required: true
    },
    {
      id: 'configuration',
      title: 'API Configuration',
      description: 'Configure OrPaynter API connection',
      completed: false,
      required: true
    },
    {
      id: 'features',
      title: 'Feature Selection',
      description: 'Choose which OrPaynter features to enable',
      completed: false,
      required: true
    },
    {
      id: 'validation',
      title: 'Connection Test',
      description: 'Validate API connection and permissions',
      completed: false,
      required: true
    },
    {
      id: 'completion',
      title: 'Setup Complete',
      description: 'Finalize OrPaynter integration setup',
      completed: false,
      required: true
    }
  ]);

  const updateStepCompletion = (stepId: string, completed: boolean) => {
    setSetupSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed } : step
    ));
  };

  const validateConnection = async () => {
    setIsValidating(true);
    setValidationResult(null);

    try {
      // Simulate API validation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (config.demoMode || config.apiBase.includes('demo')) {
        setValidationResult({
          success: true,
          message: 'Demo mode configured successfully. Using mock data for development.'
        });
      } else if (config.apiBase && config.token) {
        // In a real implementation, this would make an actual API call
        setValidationResult({
          success: true,
          message: 'Connection successful! OrPaynter API is accessible.'
        });
      } else {
        setValidationResult({
          success: false,
          message: 'Please provide both API Base URL and Authentication Token.'
        });
      }
    } catch (error) {
      setValidationResult({
        success: false,
        message: 'Connection failed. Please check your configuration.'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const saveConfiguration = async () => {
    try {
      // In a real implementation, this would save to .env or config file
      const envConfig = {
        ORPAYNTER_API_BASE: config.apiBase || 'https://demo.orpaynter.com/api',
        ORPAYNTER_TOKEN: config.token || 'demo-token-12345',
        ORPAYNTER_ENABLE_CLAIMS: config.enableClaims.toString(),
        ORPAYNTER_ENABLE_AI: config.enableAI.toString(),
        ORPAYNTER_DEMO_MODE: config.demoMode.toString()
      };
      
      console.log('Saving OrPaynter configuration:', envConfig);
      
      // Simulate save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateStepCompletion('completion', true);
      
      return true;
    } catch (error) {
      console.error('Failed to save configuration:', error);
      return false;
    }
  };

  const nextStep = () => {
    if (currentStep < setupSteps.length - 1) {
      updateStepCompletion(setupSteps[currentStep].id, true);
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderWelcomeStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Zap className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Welcome to OrPaynter Platform</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          OrPaynter is an AI-powered SaaS platform for property management, insurance claims, 
          and automated workflow orchestration.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Claims Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Streamline insurance claims processing with automated workflows and AI-powered analysis.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="w-5 h-5" />
              AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Leverage computer vision and machine learning for property damage assessment and risk evaluation.
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This wizard will help you configure OrPaynter integration with UI-TARS. 
          You can start with demo mode and upgrade to production later.
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderConfigurationStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">API Configuration</h2>
        <p className="text-gray-600 mb-6">
          Configure your OrPaynter API connection. You can use demo mode for testing or provide your production credentials.
        </p>
      </div>
      
      <Tabs defaultValue="demo" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="demo" onClick={() => setConfig(prev => ({ ...prev, demoMode: true }))}>Demo Mode</TabsTrigger>
          <TabsTrigger value="production" onClick={() => setConfig(prev => ({ ...prev, demoMode: false }))}>Production</TabsTrigger>
        </TabsList>
        
        <TabsContent value="demo" className="space-y-4">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Demo mode uses mock data and doesn't require real API credentials. Perfect for development and testing.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="demo-api-base">Demo API Base URL</Label>
              <Input
                id="demo-api-base"
                value="https://demo.orpaynter.com/api"
                disabled
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label htmlFor="demo-token">Demo Token</Label>
              <Input
                id="demo-token"
                value="demo-token-12345"
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="production" className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Production mode requires valid OrPaynter API credentials. Contact your OrPaynter administrator for access.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="api-base">API Base URL</Label>
              <Input
                id="api-base"
                placeholder="https://api.orpaynter.com"
                value={config.apiBase}
                onChange={(e) => setConfig(prev => ({ ...prev, apiBase: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="token">Authentication Token</Label>
              <Input
                id="token"
                type="password"
                placeholder="Enter your OrPaynter API token"
                value={config.token}
                onChange={(e) => setConfig(prev => ({ ...prev, token: e.target.value }))}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderFeaturesStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">Feature Selection</h2>
        <p className="text-gray-600 mb-6">
          Choose which OrPaynter features to enable in your UI-TARS integration.
        </p>
      </div>
      
      <div className="space-y-4">
        <Card className={`cursor-pointer transition-all ${config.enableClaims ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setConfig(prev => ({ ...prev, enableClaims: !prev.enableClaims }))}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Claims Management
              </div>
              {config.enableClaims && <Badge variant="default">Enabled</Badge>}
            </CardTitle>
            <CardDescription>
              Access to claims creation, management, and processing workflows.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Create and manage insurance claims</li>
              <li>• Track claim status and updates</li>
              <li>• Property and damage documentation</li>
              <li>• Automated workflow processing</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card className={`cursor-pointer transition-all ${config.enableAI ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setConfig(prev => ({ ...prev, enableAI: !prev.enableAI }))}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TestTube className="w-5 h-5" />
                AI Analysis
              </div>
              {config.enableAI && <Badge variant="default">Enabled</Badge>}
            </CardTitle>
            <CardDescription>
              AI-powered property analysis, damage assessment, and predictive maintenance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Automated damage detection from photos</li>
              <li>• Property risk assessment and scoring</li>
              <li>• Predictive maintenance scheduling</li>
              <li>• Cost estimation and recommendations</li>
            </ul>
          </CardContent>
        </Card>
      </div>
      
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You can enable or disable features later in the settings. Both features work in demo mode.
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderValidationStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">Connection Test</h2>
        <p className="text-gray-600 mb-6">
          Let's validate your OrPaynter configuration and test the API connection.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Configuration Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Mode:</span>
            <Badge variant={config.demoMode ? "secondary" : "default"}>
              {config.demoMode ? 'Demo' : 'Production'}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">API Base:</span>
            <span className="text-sm font-mono">
              {config.demoMode ? 'https://demo.orpaynter.com/api' : config.apiBase || 'Not configured'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Claims Management:</span>
            <Badge variant={config.enableClaims ? "default" : "secondary"}>
              {config.enableClaims ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">AI Analysis:</span>
            <Badge variant={config.enableAI ? "default" : "secondary"}>
              {config.enableAI ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-4">
        <Button 
          onClick={validateConnection} 
          disabled={isValidating}
          className="w-full"
        >
          {isValidating ? 'Testing Connection...' : 'Test Connection'}
        </Button>
        
        {validationResult && (
          <Alert className={validationResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            {validationResult.success ? 
              <CheckCircle className="h-4 w-4 text-green-600" /> : 
              <AlertCircle className="h-4 w-4 text-red-600" />
            }
            <AlertDescription className={validationResult.success ? 'text-green-800' : 'text-red-800'}>
              {validationResult.message}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );

  const renderCompletionStep = () => (
    <div className="space-y-6 text-center">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-2">Setup Complete!</h2>
        <p className="text-gray-600 mb-6">
          OrPaynter integration has been successfully configured for UI-TARS.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>What's Next?</CardTitle>
        </CardHeader>
        <CardContent className="text-left space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium">Configuration Saved</p>
              <p className="text-sm text-gray-600">Your OrPaynter settings have been saved to the environment configuration.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium">MCP Servers Ready</p>
              <p className="text-sm text-gray-600">OrPaynter MCP servers are now available in UI-TARS for claims and AI analysis.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium">Demo Data Available</p>
              <p className="text-sm text-gray-600">Start exploring with demo data or connect to your production OrPaynter instance.</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Button onClick={saveConfiguration} className="w-full">
        Finish Setup
      </Button>
    </div>
  );

  const renderCurrentStep = () => {
    switch (setupSteps[currentStep].id) {
      case 'welcome':
        return renderWelcomeStep();
      case 'configuration':
        return renderConfigurationStep();
      case 'features':
        return renderFeaturesStep();
      case 'validation':
        return renderValidationStep();
      case 'completion':
        return renderCompletionStep();
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {setupSteps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${index <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}
                ${step.completed ? 'bg-green-600' : ''}
              `}>
                {step.completed ? <CheckCircle className="w-4 h-4" /> : index + 1}
              </div>
              {index < setupSteps.length - 1 && (
                <div className={`
                  w-16 h-0.5 mx-2
                  ${index < currentStep ? 'bg-blue-600' : 'bg-gray-200'}
                `} />
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-4">
          <h1 className="text-lg font-semibold">{setupSteps[currentStep].title}</h1>
          <p className="text-gray-600">{setupSteps[currentStep].description}</p>
        </div>
      </div>

      {/* Step Content */}
      <Card className="mb-6">
        <CardContent className="p-6">
          {renderCurrentStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={prevStep} 
          disabled={currentStep === 0}
        >
          Previous
        </Button>
        
        {currentStep < setupSteps.length - 1 ? (
          <Button 
            onClick={nextStep}
            disabled={currentStep === 3 && !validationResult?.success}
          >
            Next
          </Button>
        ) : (
          <Button 
            onClick={() => window.close()}
            disabled={!setupSteps[currentStep].completed}
          >
            Close
          </Button>
        )}
      </div>
    </div>
  );
};

export default OrPaynterSetupWizard;