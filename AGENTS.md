# PROJECT KNOWLEDGE BASE

**Last Updated:** 2026-01-02
**Project:** my-ai-pet

## PROJECT OVERVIEW

A desktop pet application (my-ai-pet) featuring a transparent, frameless, and always-on-top Electron window. The character floats on the desktop with alpha-channel mouse click-through, allowing users to interact with the pet or have it stay as a "ghost" that doesn't interfere with other windows. It integrates with Ollama for local AI chat capabilities.

## ARCHITECTURE

```
[Main Process (Electron)]          [Preload (Bridge)]          [Renderer (React)]
         │                                 │                           │
  BrowserWindow Config              contextBridge              App Component
  - transparent: true               - exposeInMainWorld        - Character Image
  - frame: false                    - window.api               - Canvas alpha check
  - alwaysOnTop: true                      │                           │
         │                                 │                           │
   IPC Handlers <──────────────────────────┴────────────────────────── Hooks
  - Mouse Events                                               - usePixelTransparency
  - Window Dragging                                            - useWindowDrag
  - Interaction Modes                                          - useInteractionMode
  - AI Chat (Ollama)                                           - useChat
         │                                                             │
   System Tray & Store                                           UI Components
  - Size persistence                                           - ChatBubble
  - Mode switching                                             - Character
```

## IMPLEMENTED FEATURES

- **Transparent Window**: Frameless, always-on-top window with background transparency (`src/main/index.ts`).
- **Alpha-Channel Passthrough**: Mouse events are ignored when the cursor is over transparent pixels (alpha=0), allowing clicks to pass through to windows behind the pet (`src/renderer/src/hooks/usePixelTransparency.ts`).
- **Interaction Modes**: Three distinct modes (`src/renderer/src/hooks/useInteractionMode.ts`):
  - `passthrough`: Normal mode, clicks pass through transparent areas.
  - `interactive`: Character is always clickable, enabling chat interaction.
  - `ghost`: All clicks pass through the character entirely.
- **IPC Window Dragging**: Custom dragging logic allows moving the window even without a title bar (`src/renderer/src/hooks/useWindowDrag.ts`).
- **Global Hotkey**: `CmdOrControl+Shift+D` to cycle between interaction modes (`src/main/index.ts`).
- **AI Integration**: Integration with local Ollama API for character interaction (`src/main/services/ollamaService.ts`).
- **Chat UI**: Interactive chat bubble for communicating with the pet (`src/renderer/src/components/ChatBubble.tsx`).
- **Persistence**: Remembers window position and character size across restarts using `electron-store` (`src/main/index.ts`).
- **System Tray**: Provides a menu to quit the app or resize the character (100px to 500px) (`src/main/index.ts`).

## UNIMPLEMENTED FEATURES (TODO)

- **Character Animations**: Integration of `lottie-react` for idle, talking, and reaction animations.
- **Styling System**: Migration to `styled-components` for more robust component styling.
- **Auto-Updates**: Functional `electron-updater` configuration (currently using placeholder URL).
- **Multiple Characters**: Support for loading different character assets.
- **Customization UI**: In-app settings for character selection and AI personality (system prompt).
- **Advanced Chat**: Support for streaming AI responses and chat history persistence.
- **Notifications**: System notifications for scheduled reminders or pet status.
- **Scheduled Interactions**: Random pet actions or reminders based on time.

## FILE STRUCTURE

```
Desktop_assistant/
├── src/
│   ├── main/
│   │   ├── services/
│   │   │   └── ollamaService.ts    # AI chat logic
│   │   └── index.ts                # Main process, window & IPC config
│   ├── preload/
│   │   └── index.ts                # IPC bridge exposure
│   └── renderer/src/
│       ├── assets/                 # CSS, character images (PNG/GIF)
│       ├── components/             # React UI components
│       │   └── ChatBubble.tsx      # Chat interface
│       ├── hooks/                  # Custom React logic
│       │   ├── useInteractionMode.ts
│       │   ├── usePixelTransparency.ts
│       │   └── useWindowDrag.ts
│       ├── App.tsx                 # Root application component
│       └── main.tsx                # React entry point
├── electron-builder.yml            # Build and update configuration
├── package.json                    # Project metadata and dependencies
└── tsconfig.json                   # TypeScript configuration
```

## IPC API REFERENCE

| Channel                    | Method   | Description                                                  |
| -------------------------- | -------- | ------------------------------------------------------------ |
| `set-ignore-mouse-events`  | `send`   | Toggles whether the window ignores mouse events.             |
| `start-drag` / `stop-drag` | `send`   | Controls custom window dragging logic.                       |
| `resize-window`            | `send`   | Resizes the Electron window.                                 |
| `get-interaction-mode`     | `invoke` | Gets the current interaction mode from the main process.     |
| `set-interaction-mode`     | `send`   | Sets the interaction mode (passthrough, interactive, ghost). |
| `interaction-mode-changed` | `on`     | Listener for when the mode changes via global hotkey.        |
| `chat`                     | `invoke` | Sends a message to the Ollama service.                       |
| `get-character-size`       | `invoke` | Retrieves the saved character size.                          |
| `set-character-size`       | `send`   | Saves and applies a new character size.                      |

## DEVELOPMENT COMMANDS

```bash
npm run dev          # Start development environment with HMR
npm run build        # Typecheck and build for production
npm run build:win    # Build Windows installer
npm run build:mac    # Build macOS DMG
npm run build:linux  # Build Linux package
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

## CONVENTIONS

- **Style**: No semicolons, single quotes, 100 character line limit, 2-space indentation.
- **Path Alias**: Use `@renderer/*` for `src/renderer/src/*`.
- **IPC**: All IPC communication should be funneled through the `window.api` bridge defined in `preload/index.ts`.
- **Transparency**: Maintain `transparent: true` for the main window; avoid solid backgrounds in the renderer.

---

## 현재까지 진행 내용 (KOREAN)

- [x] 투명, 프레임리스, 항상 위에 있는 데스크톱 펫 창 구성
- [x] 캐릭터 이미지의 알파 채널(투명도)을 감지하여 마우스 이벤트 통과 처리
- [x] 3가지 상호작용 모드 구현 (통과, 상호작용, 유령 모드)
- [x] 전역 단축키(`Cmd/Ctrl+Shift+D`)를 통한 모드 전환 기능
- [x] IPC 기반의 사용자 정의 창 드래그 기능 구현
- [x] Ollama 로컬 AI 연동을 통한 실시간 채팅 기능
- [x] `electron-store`를 사용한 창 위치 및 캐릭터 크기 설정 유지
- [x] 시스템 트레이 메뉴를 통한 앱 종료 및 크기 조절 기능
