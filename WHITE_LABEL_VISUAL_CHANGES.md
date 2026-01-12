# White Label Visual Changes: UI-TARS → Trinity-AI

This document shows before and after examples of the branding changes.

## Application Title

### Before (UI-TARS)
```html
<title>UI-TARS Desktop</title>
```

### After (Trinity-AI)
```html
<title>Trinity-AI Desktop</title>
```

---

## Welcome Screen

### Before (UI-TARS)
```tsx
<h1 className="text-2xl font-semibold mt-1 mb-8">
  Welcome to UI-TARS Desktop
</h1>
```

### After (Trinity-AI)
```tsx
<h1 className="text-2xl font-semibold mt-1 mb-8">
  Welcome to Trinity-AI Desktop
</h1>
```

---

## macOS Menu Bar

### Before (UI-TARS)
```typescript
{
  label: 'UI-TARS Desktop',
  submenu: [
    {
      label: 'About UI-TARS Desktop',
      selector: 'orderFrontStandardAboutPanel:',
    },
    // ...
    {
      label: 'Hide UI-TARS Desktop',
      accelerator: 'Command+H',
      selector: 'hide:',
    },
  ]
}
```

### After (Trinity-AI)
```typescript
{
  label: 'Trinity-AI Desktop',
  submenu: [
    {
      label: 'About Trinity-AI Desktop',
      selector: 'orderFrontStandardAboutPanel:',
    },
    // ...
    {
      label: 'Hide Trinity-AI Desktop',
      accelerator: 'Command+H',
      selector: 'hide:',
    },
  ]
}
```

---

## Sidebar Branding

### Before (UI-TARS)
```tsx
<span className="truncate font-semibold">UI-TARS</span>
```

### After (Trinity-AI)
```tsx
<span className="truncate font-semibold">Trinity-AI</span>
```

---

## Feature Descriptions

### Computer Operator - Before (UI-TARS)
```tsx
<CardDescription>
  Use the UI-TARS model to automate and complete tasks directly on
  your computer with AI assistance.
</CardDescription>
```

### Computer Operator - After (Trinity-AI)
```tsx
<CardDescription>
  Use the Trinity-AI model to automate and complete tasks directly on
  your computer with AI assistance.
</CardDescription>
```

### Browser Operator - Before (UI-TARS)
```tsx
<CardDescription>
  Let the UI-TARS model help you automate browser tasks, from
  navigating pages to filling out forms.
</CardDescription>
```

### Browser Operator - After (Trinity-AI)
```tsx
<CardDescription>
  Let the Trinity-AI model help you automate browser tasks, from
  navigating pages to filling out forms.
</CardDescription>
```

---

## Screen Recording Watermark

### Before (UI-TARS)
```typescript
const watermarkText = `© ${new Date().getFullYear()} UI-TARS Desktop`;
```

### After (Trinity-AI)
```typescript
const watermarkText = `© ${new Date().getFullYear()} Trinity-AI Desktop`;
```

---

## Build Configuration

### electron-builder.yml - Before (UI-TARS)
```yaml
productName: UI-TARS
win:
  executableName: UI-TARS
publish:
  updaterCacheDirName: ui-tars-updater
```

### electron-builder.yml - After (Trinity-AI)
```yaml
productName: Trinity-AI
win:
  executableName: Trinity-AI
publish:
  updaterCacheDirName: trinity-ai-updater
```

---

## Documentation

### Quick Start - Before (UI-TARS)
```markdown
1. Drag **UI TARS** application into the **Applications** folder
2. Enable the permission of **UI TARS** in MacOS
3. Then open **UI TARS** application
```

### Quick Start - After (Trinity-AI)
```markdown
1. Drag **Trinity-AI** application into the **Applications** folder
2. Enable the permission of **Trinity-AI** in MacOS
3. Then open **Trinity-AI** application
```

---

## Share Dialog Messages

### Before (UI-TARS)
```tsx
📢 Would you like to share your report to help us improve{' '}
<b>UI-TARS</b>? This includes your screen recordings and actions.
```

### After (Trinity-AI)
```tsx
📢 Would you like to share your report to help us improve{' '}
<b>Trinity-AI</b>? This includes your screen recordings and actions.
```

---

## Free Trial Agreement

### Before (UI-TARS)
```tsx
experience UI-TARS with remote computer and browser operations
// ...
Thank you for your support of the UI-TARS research project!
```

### After (Trinity-AI)
```tsx
experience Trinity-AI with remote computer and browser operations
// ...
Thank you for your support of the Trinity-AI research project!
```

---

## README Fork Notice

### Added (Trinity-AI)
```markdown
> **Note:** This is a white-labeled fork of [UI-TARS-desktop](https://github.com/bytedance/UI-TARS-desktop). 
> The desktop application has been rebranded as "Trinity-AI Desktop" while maintaining the core 
> functionality and technology from the original UI-TARS project.
```

---

## What Users Will See

### Application Launcher
- **macOS Dock**: "Trinity-AI" (instead of "UI TARS")
- **Windows Taskbar**: "Trinity-AI" (instead of "UI-TARS")
- **Applications Folder**: "Trinity-AI.app" (instead of "UI TARS.app")

### System Permissions Dialogs
- "Trinity-AI would like to control this computer using accessibility features"
- "Trinity-AI would like to record your screen"

### Window Title Bar
- "Trinity-AI Desktop" appears in the title bar

### In-App Experience
- All menus show "Trinity-AI Desktop"
- Welcome screen greets users with Trinity-AI branding
- Settings and dialogs consistently use Trinity-AI naming
- Screen recording watermarks show "© 2025 Trinity-AI Desktop"

---

## Installation Experience

### macOS Installation
1. User downloads "Trinity-AI-{version}.dmg"
2. Drag-and-drop shows "Trinity-AI.app" → Applications
3. First launch shows "Trinity-AI would like to..." permission requests
4. Application appears as "Trinity-AI" in all system UI

### Windows Installation
1. User downloads "TrinityAi-{version}-setup.exe"
2. Installer shows "Trinity-AI Setup"
3. Application installs as "Trinity-AI"
4. Start menu and desktop shortcuts show "Trinity-AI"

---

## Consistent Branding Elements

Throughout the application, users will see consistent branding:

✅ **Application name**: Trinity-AI (never UI-TARS)  
✅ **Full product name**: Trinity-AI Desktop  
✅ **Model references**: Uses Trinity-AI model (in user-facing text)  
✅ **Watermarks**: © 2025 Trinity-AI Desktop  
✅ **Documentation**: All guides reference Trinity-AI Desktop  

While maintaining acknowledgment:

📚 **Technical docs**: Acknowledges UI-TARS as the underlying technology  
🔗 **Links**: Preserves links to original UI-TARS research  
📖 **README**: Clear fork notice and attribution  
🎓 **Citations**: Original academic citations remain  
