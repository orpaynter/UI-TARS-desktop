# White Label Summary: UI-TARS → Trinity-AI

This document summarizes the white labeling changes made to rebrand the desktop application from "UI-TARS" to "Trinity-AI".

## Overview

The application has been successfully rebranded from "UI-TARS Desktop" to "Trinity-AI Desktop" while maintaining all core functionality and acknowledging the original UI-TARS project.

## Changes Made

### 1. Core Application Configuration

#### Package Configuration
- **package.json** (root): Updated description to reference Trinity-AI
- **apps/ui-tars/package.json**: Updated product description

#### Build Configuration
- **electron-builder.yml**:
  - Product name: `UI-TARS` → `Trinity-AI`
  - Executable name: `UI-TARS` → `Trinity-AI`
  - Updater cache dir: `ui-tars-updater` → `trinity-ai-updater`

- **forge.config.ts**:
  - Application name: `UI TARS` → `Trinity AI`
  - Executable name: `UI-TARS` → `Trinity-AI`
  - Squirrel name: `UiTars` → `TrinityAi`

### 2. Main Process (Backend)

#### Menu System
- **apps/ui-tars/src/main/menu.ts**:
  - Menu label: `UI-TARS Desktop` → `Trinity-AI Desktop`
  - About menu: `About UI-TARS Desktop` → `About Trinity-AI Desktop`
  - Hide menu: `Hide UI-TARS Desktop` → `Hide Trinity-AI Desktop`

#### Constants
- **apps/ui-tars/src/main/shared/constants.ts**:
  - Repository name: `UI-TARS-desktop` → `Trinity-AI-desktop`

### 3. Renderer Process (Frontend)

#### HTML
- **apps/ui-tars/src/renderer/index.html**:
  - Page title: `UI-TARS Desktop` → `Trinity-AI Desktop`

#### React Components
- **Home Page** (`pages/home/index.tsx`):
  - Welcome message: `Welcome to UI-TARS Desktop` → `Welcome to Trinity-AI Desktop`
  - Computer Operator description: Updated to reference Trinity-AI model
  - Browser Operator description: Updated to reference Trinity-AI model

- **Navigation Header** (`components/SideBar/nav-header.tsx`):
  - App name: `UI-TARS` → `Trinity-AI`

- **Screen Recording** (`components/ScreenRecorder/index.tsx` & `hooks/useScreenRecord.ts`):
  - Watermark: `© {year} UI-TARS Desktop` → `© {year} Trinity-AI Desktop`

- **Share Dialogs** (`components/SideBar/share.tsx`, `components/RunMessages/ShareOptions.tsx`):
  - Share message: `help us improve UI-TARS` → `help us improve Trinity-AI`

- **Free Trial Dialog** (`components/AlertDialog/freeTrialDialog.tsx`):
  - Service description: Updated to reference Trinity-AI
  - Project support message: `UI-TARS research project` → `Trinity-AI research project`

### 4. Documentation

#### README.md
- Added note at top identifying this as a white-labeled fork
- Updated desktop section header: `UI-TARS Desktop` → `Trinity-AI Desktop`
- Added description acknowledging the original UI-TARS project

#### User Documentation
- **docs/quick-start.md**:
  - Updated all references to the desktop app name
  - Installation instructions now reference Trinity-AI
  - Settings configuration references updated

- **docs/setting.md**:
  - Updated overview to reference Trinity-AI Desktop
  - UTIO description updated to reference Trinity-AI Desktop

## Technical Notes

### What Was NOT Changed

1. **Model References**: References to "UI-TARS-1.0", "UI-TARS-1.5", and "Doubao-1.5-UI-TARS" remain unchanged as these are model names, not product branding.

2. **External URLs**: Links to the original bytedance/UI-TARS-desktop repository remain as they reference the upstream project.

3. **Package Names**: Internal package names (e.g., `@ui-tars/*`) remain unchanged to avoid breaking dependencies.

4. **Agent TARS**: The Agent TARS section of the repository (separate from the desktop app) was not modified.

5. **Workflow Files**: CI/CD workflow names were not changed as they are internal tooling.

### Icons and Assets

The existing icon and logo files in `apps/ui-tars/resources/` were not modified. In a production deployment, you would want to replace these with Trinity-AI branded assets:
- `icon.icns` (macOS)
- `icon.ico` (Windows)
- `icon.png` (general)
- `logo-vector.png`
- `logo-full.png`

## User-Visible Changes

When users launch the application, they will see:

1. **Application Name**: "Trinity-AI" in:
   - Dock/Taskbar
   - Application menu (macOS)
   - Window title bar
   - About dialog
   - System settings/permissions dialogs

2. **UI Text**: All user-facing text consistently uses "Trinity-AI"

3. **Watermarks**: Screen recordings show "© 2025 Trinity-AI Desktop"

4. **Documentation**: All user guides reference "Trinity-AI Desktop"

## Migration Path

For users upgrading from the original UI-TARS Desktop:

1. The executable name has changed (`UI-TARS` → `Trinity-AI`)
2. Application settings will be stored in a new location
3. The updater cache directory has changed
4. Users will need to re-grant system permissions for the new application name

## Acknowledgment

This white-labeled version maintains full attribution to the original UI-TARS project:
- README includes a clear fork notice
- Documentation references the original UI-TARS research
- Original project links are preserved
- Academic citations remain unchanged
