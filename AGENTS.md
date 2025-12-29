# PROJECT KNOWLEDGE BASE

**Generated:** 2025-12-29
**Commit:** 9e8b3ea
**Branch:** main

## OVERVIEW

Desktop pet app (my-ai-pet) - transparent, frameless, always-on-top Electron window with alpha-channel mouse click-through. Character image floats on desktop, clicks pass through transparent areas.

## STRUCTURE

```
Desktop_assistant/
├── src/
│   ├── main/index.ts       # Electron main process, window config, IPC handlers
│   ├── preload/index.ts    # contextBridge API exposure (setIgnoreMouseEvents)
│   └── renderer/src/       # React frontend
│       ├── App.tsx         # Core logic: alpha detection, mouse passthrough
│       ├── main.tsx        # React entry
│       └── assets/         # CSS, character images (PNG/GIF)
├── build/                  # Electron-builder resources (icons, entitlements)
├── resources/              # App icon
└── out/                    # Build output (gitignored)
```

## WHERE TO LOOK

| Task                                        | Location                                                               | Notes                            |
| ------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------- |
| Window behavior (transparency, alwaysOnTop) | `src/main/index.ts`                                                    | BrowserWindow config             |
| Mouse passthrough logic                     | `src/renderer/src/App.tsx`                                             | Alpha channel detection          |
| IPC bridge                                  | `src/preload/index.ts`                                                 | `setIgnoreMouseEvents` API       |
| Add new IPC                                 | main: `ipcMain.on()`, preload: `contextBridge`, renderer: `window.api` |
| Character assets                            | `src/renderer/src/assets/characters/`                                  | PNG for static, GIF for animated |
| Build config                                | `electron-builder.yml`                                                 | Mac/Win/Linux targets            |
| Styling                                     | `src/renderer/src/assets/main.css`                                     | Uses Tailwind + CSS vars         |

## ARCHITECTURE

```
[Main Process]                    [Preload]                    [Renderer]
     │                                │                             │
BrowserWindow                  contextBridge.              React App
  - transparent: true          exposeInMainWorld            - <img> character
  - frame: false                    │                       - canvas alpha check
  - alwaysOnTop: true               │                             │
     │                              │                             │
ipcMain.on(                   window.api = {              window.api.
  'set-ignore-mouse-          setIgnoreMouseEvents()      setIgnoreMouseEvents(
   events')                   }                             alpha === 0)
     │                              │                             │
window.setIgnoreMouseEvents() ◄─────┴─────────────────────────────┘
```

## CONVENTIONS

- **No semicolons**: Prettier enforces `semi: false`
- **Single quotes**: `'string'` not `"string"`
- **100 char lines**: Wider than default 80
- **No trailing commas**
- **2-space indent**
- **Path alias**: `@renderer/*` → `src/renderer/src/*`

## UNIQUE PATTERNS (THIS PROJECT)

- **Alpha passthrough**: Mouse events ignored when cursor over transparent pixel (alpha=0)
- **Canvas sampling**: Draws image to hidden canvas at load time, reads pixel alpha at cursor position
- **IPC-based drag**: Manual window dragging via `start-drag`/`stop-drag` IPC (NOT `-webkit-app-region`)
- **Pointer events control**: `html/body/#root` have `pointer-events: none`, only `.character` has `auto`
- **Refs for performance**: `ignoreMouseRef` prevents redundant IPC calls

## ANTI-PATTERNS

- **Don't use solid backgrounds**: Window must stay `transparent: true` for passthrough
- **Don't remove sandbox:false**: Required for preload context bridge
- **Avoid frequent IPC**: Alpha check throttled via ref comparison

## COMMANDS

```bash
npm run dev          # Development with HMR
npm run build        # Typecheck + build
npm run build:mac    # Build macOS DMG
npm run build:win    # Build Windows installer
npm run lint         # ESLint
npm run format       # Prettier
npm run typecheck    # TS check both node + web configs
```

## DEPENDENCIES

| Package             | Purpose                                          |
| ------------------- | ------------------------------------------------ |
| electron-toolkit/\* | Prebuilt configs (eslint, tsconfig, utils)       |
| styled-components   | Component styling (available, not yet used)      |
| lottie-react        | Animations (available, not yet used)             |
| electron-store      | Persistence (available, not yet used)            |
| electron-updater    | Auto-updates (configured, points to example.com) |
| tailwindcss         | Utility CSS (v4, configured)                     |

## NOTES

- **Unused deps**: styled-components, lottie-react, electron-store imported but not used yet
- **Auto-update URL**: `electron-builder.yml` has placeholder `https://example.com/auto-updates`
- **Mac notarize**: Disabled (`notarize: false`)
- **Character size**: Fixed 256px width in CSS
- **Korean README**: Progress notes in Korean, project targets Korean users
