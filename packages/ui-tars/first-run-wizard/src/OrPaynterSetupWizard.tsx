import React, { useState, useEffect } from 'react';
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
    <div style={{ padding: '24px', textAlign: 'center' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ 
          width: '64px', 
          height: '64px', 
          backgroundColor: '#dbeafe', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 16px' 
        }}>
          <Zap style={{ width: '32px', height: '32px', color: '#2563eb' }} />
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Welcome to OrPaynter Platform</h2>
        <p style={{ color: '#6b7280', maxWidth: '400px', margin: '0 auto' }}>
          OrPaynter is an AI-powered SaaS platform for property management, insurance claims, 
          and automated workflow orchestration.
        </p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Settings style={{ width: '20px', height: '20px' }} />
            Claims Management
          </h3>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Streamline insurance claims processing with automated workflows and AI-powered analysis.
          </p>
        </div>
        
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <TestTube style={{ width: '20px', height: '20px' }} />
            AI Analysis
          </h3>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Leverage computer vision and machine learning for property damage assessment and risk evaluation.
          </p>
        </div>
      </div>
    </div>
  );

  const renderConfigurationStep = () => (
    <div style={{ padding: '24px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>API Configuration</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>API Base URL</label>
          <input
            type="text"
            value={config.apiBase}
            onChange={(e) => setConfig(prev => ({ ...prev, apiBase: e.target.value }))}
            placeholder="https://api.orpaynter.com"
            style={{ 
              width: '100%', 
              padding: '8px 12px', 
              border: '1px solid #d1d5db', 
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Authentication Token</label>
          <input
            type="password"
            value={config.token}
            onChange={(e) => setConfig(prev => ({ ...prev, token: e.target.value }))}
            placeholder="Enter your API token"
            style={{ 
              width: '100%', 
              padding: '8px 12px', 
              border: '1px solid #d1d5db', 
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            id="demoMode"
            checked={config.demoMode}
            onChange={(e) => setConfig(prev => ({ ...prev, demoMode: e.target.checked }))}
          />
          <label htmlFor="demoMode" style={{ fontSize: '14px' }}>Enable Demo Mode (uses mock data)</label>
        </div>
      </div>
    </div>
  );

  const renderFeaturesStep = () => (
    <div style={{ padding: '24px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Feature Selection</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            id="enableClaims"
            checked={config.enableClaims}
            onChange={(e) => setConfig(prev => ({ ...prev, enableClaims: e.target.checked }))}
          />
          <label htmlFor="enableClaims" style={{ fontSize: '14px' }}>Enable Claims Management</label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            id="enableAI"
            checked={config.enableAI}
            onChange={(e) => setConfig(prev => ({ ...prev, enableAI: e.target.checked }))}
          />
          <label htmlFor="enableAI" style={{ fontSize: '14px' }}>Enable AI Analysis</label>
        </div>
      </div>
    </div>
  );

  const renderValidationStep = () => (
    <div style={{ padding: '24px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Connection Test</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <button
          onClick={validateConnection}
          disabled={isValidating}
          style={{
            padding: '12px 24px',
            backgroundColor: isValidating ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isValidating ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          {isValidating ? 'Testing Connection...' : 'Test Connection'}
        </button>
        
        {validationResult && (
          <div style={{
            padding: '12px',
            borderRadius: '6px',
            backgroundColor: validationResult.success ? '#dcfce7' : '#fef2f2',
            border: `1px solid ${validationResult.success ? '#bbf7d0' : '#fecaca'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {validationResult.success ? (
              <CheckCircle style={{ width: '16px', height: '16px', color: '#16a34a' }} />
            ) : (
              <AlertCircle style={{ width: '16px', height: '16px', color: '#dc2626' }} />
            )}
            <span style={{ fontSize: '14px', color: validationResult.success ? '#16a34a' : '#dc2626' }}>
              {validationResult.message}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  const renderCompletionStep = () => (
    <div style={{ padding: '24px', textAlign: 'center' }}>
      <div style={{
        width: '64px',
        height: '64px',
        backgroundColor: '#dcfce7',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px'
      }}>
        <CheckCircle style={{ width: '32px', height: '32px', color: '#16a34a' }} />
      </div>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Setup Complete!</h2>
      <p style={{ color: '#6b7280', marginBottom: '24px' }}>
        OrPaynter has been successfully configured and is ready to use.
      </p>
      <button
        onClick={saveConfiguration}
        style={{
          padding: '12px 24px',
          backgroundColor: '#16a34a',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        Save Configuration
      </button>
    </div>
  );

  const renderCurrentStep = () => {
    switch (setupSteps[currentStep]?.id) {
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
        return <div>Unknown step</div>;
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          {setupSteps.map((step, index) => (
            <div
              key={step.id}
              style={{
                flex: 1,
                height: '4px',
                backgroundColor: index <= currentStep ? '#3b82f6' : '#e5e7eb',
                marginRight: index < setupSteps.length - 1 ? '4px' : '0'
              }}
            />
          ))}
        </div>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '18px', fontWeight: '600' }}>
            {setupSteps[currentStep]?.title}
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Step {currentStep + 1} of {setupSteps.length}
          </p>
        </div>
      </div>

      <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '24px' }}>
        {renderCurrentStep()}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button
          onClick={prevStep}
          disabled={currentStep === 0}
          style={{
            padding: '8px 16px',
            backgroundColor: currentStep === 0 ? '#f3f4f6' : '#6b7280',
            color: currentStep === 0 ? '#9ca3af' : 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          Previous
        </button>
        
        <button
          onClick={nextStep}
          disabled={currentStep === setupSteps.length - 1}
          style={{
            padding: '8px 16px',
            backgroundColor: currentStep === setupSteps.length - 1 ? '#f3f4f6' : '#3b82f6',
            color: currentStep === setupSteps.length - 1 ? '#9ca3af' : 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: currentStep === setupSteps.length - 1 ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          {currentStep === setupSteps.length - 1 ? 'Complete' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default OrPaynterSetupWizard;