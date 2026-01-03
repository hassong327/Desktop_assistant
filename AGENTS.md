# PROJECT KNOWLEDGE BASE

**Last Updated:** 2026-01-03
**Project:** my-ai-pet

## PROJECT OVERVIEW

A desktop pet application (my-ai-pet) featuring a transparent, frameless, and always-on-top Electron window. The character floats on the desktop with alpha-channel mouse click-through, allowing users to interact with the pet or have it stay as a "ghost" that doesn't interfere with other windows. It integrates with Ollama for local AI chat capabilities via a separate chat window.

## ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Main Process (Electron)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  Pet Window (BrowserWindow)          Chat Window (BrowserWindow)            │
│  - transparent: true                 - transparent: false                   │
│  - frame: false                      - frame: false                         │
│  - alwaysOnTop: true                 - alwaysOnTop: true                    │
│  - Fixed size (characterSize)        - 380x500 fixed                        │
│         │                                    │                              │
│         └──────────── IPC ───────────────────┘                              │
│                       │                                                     │
│  ┌────────────────────┴────────────────────┐                                │
│  │ IPC Handlers                            │                                │
│  │ - toggle-chat / close-chat              │                                │
│  │ - set-ignore-mouse-events               │                                │
│  │ - start-drag / stop-drag                │                                │
│  │ - interaction-mode-changed              │                                │
│  │ - chat (Ollama)                         │                                │
│  └─────────────────────────────────────────┘                                │
│                                                                             │
│  System Tray & Store (electron-store)                                       │
│  - Window position persistence                                              │
│  - Character size settings                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                        [Preload Bridge]
                        contextBridge
                        window.api
                              │
┌─────────────────────────────┴───────────────────────────────────────────────┐
│                           Renderer (React)                                  │
├──────────────────────────────────┬──────────────────────────────────────────┤
│  Pet Window (index.html)         │  Chat Window (chat.html)                 │
│  ┌────────────────────────────┐  │  ┌────────────────────────────────────┐  │
│  │ App.tsx                    │  │  │ ChatApp.tsx                        │  │
│  │ - Character Image          │  │  │ - Message bubbles (user/assistant) │  │
│  │ - usePixelTransparency     │  │  │ - Input field                      │  │
│  │ - useWindowDrag            │  │  │ - Auto-scroll                      │  │
│  │ - useInteractionMode       │  │  │ - Typing indicator                 │  │
│  │ - Click → toggleChat()     │  │  │ - Draggable header                 │  │
│  └────────────────────────────┘  │  └────────────────────────────────────┘  │
└──────────────────────────────────┴──────────────────────────────────────────┘
```

## IMPLEMENTED FEATURES

- **Transparent Pet Window**: Frameless, always-on-top window with background transparency. Fixed size based on character settings (`src/main/index.ts`).
- **Separate Chat Window**: Non-transparent popup window for AI chat. Opens beside the pet character when clicked in interactive mode (`src/main/index.ts`).
- **Alpha-Channel Passthrough**: Mouse events are ignored when the cursor is over transparent pixels (alpha=0), allowing clicks to pass through to windows behind the pet (`src/renderer/src/hooks/usePixelTransparency.ts`).
- **Interaction Modes**: Three distinct modes (`src/renderer/src/hooks/useInteractionMode.ts`):
  - `passthrough`: Normal mode, clicks pass through transparent areas.
  - `interactive`: Character is always clickable, click opens chat window.
  - `ghost`: All clicks pass through the character entirely.
- **IPC Window Dragging**: Custom dragging logic allows moving the window even without a title bar (`src/renderer/src/hooks/useWindowDrag.ts`).
- **Global Hotkey**: `CmdOrControl+Shift+D` to cycle between interaction modes (`src/main/index.ts`).
- **AI Integration**: Integration with local Ollama API using `/api/chat` endpoint with conversation history and character personality (`src/main/services/ollamaService.ts`).
- **Bubble Chat UI**: Modern chat interface with user/assistant message bubbles, typing indicator, and auto-scroll (`src/renderer/src/ChatApp.tsx`).
- **Persistence**: Remembers window position and character size across restarts using `electron-store` (`src/main/index.ts`).
- **System Tray**: Provides a menu to quit the app or resize the character (100px to 500px) (`src/main/index.ts`).
- **Chat Window Positioning**: Chat window automatically repositions when pet window is moved (`src/main/index.ts`).

## UNIMPLEMENTED FEATURES (TODO)

- **Character Animations**: Integration of `lottie-react` for idle, talking, and reaction animations.
- **Styling System**: Migration to `styled-components` for more robust component styling.
- **Auto-Updates**: Functional `electron-updater` configuration (currently using placeholder URL).
- **Multiple Characters**: Support for loading different character assets.
- **Customization UI**: In-app settings for character selection and AI personality (system prompt).
- **Streaming Chat**: Support for streaming AI responses.
- **Chat History Persistence**: Save conversation history to disk.
- **Notifications**: System notifications for scheduled reminders or pet status.
- **Scheduled Interactions**: Random pet actions or reminders based on time.
- **OpenCode Integration**: Connect with OpenCode CLI or Claude API for advanced coding assistance.

## FILE STRUCTURE

```
Desktop_assistant/
├── src/
│   ├── main/
│   │   ├── services/
│   │   │   └── ollamaService.ts        # AI chat with personality & history
│   │   └── index.ts                    # Main process, dual window management
│   ├── preload/
│   │   ├── index.ts                    # IPC bridge exposure
│   │   └── index.d.ts                  # Type definitions
│   └── renderer/
│       ├── index.html                  # Pet window entry
│       ├── chat.html                   # Chat window entry
│       └── src/
│           ├── assets/
│           │   ├── characters/         # Character images (PNG/GIF)
│           │   ├── main.css            # Pet window styles
│           │   ├── chat.css            # Chat window styles
│           │   └── base.css            # Base styles
│           ├── hooks/
│           │   ├── index.ts            # Hook exports
│           │   ├── useInteractionMode.ts
│           │   ├── usePixelTransparency.ts
│           │   └── useWindowDrag.ts
│           ├── App.tsx                 # Pet window component
│           ├── ChatApp.tsx             # Chat window component
│           ├── main.tsx                # Pet React entry
│           ├── chat-main.tsx           # Chat React entry
│           └── env.d.ts                # Window API types
├── electron.vite.config.ts             # Multi-page Vite config
├── electron-builder.yml                # Build configuration
├── package.json
└── tsconfig.json
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
| `toggle-chat`              | `send`   | Opens or hides the chat window.                              |
| `close-chat`               | `send`   | Hides the chat window.                                       |
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
npm run typecheck    # Run TypeScript type checking
```

## CONVENTIONS

- **Style**: No semicolons, single quotes, 100 character line limit, 2-space indentation.
- **Path Alias**: Use `@renderer/*` for `src/renderer/src/*`.
- **IPC**: All IPC communication should be funneled through the `window.api` bridge defined in `preload/index.ts`.
- **Windows**: Pet window is transparent; Chat window is opaque with dark theme.
- **Multi-page**: Use `electron.vite.config.ts` to configure multiple HTML entry points.

---

## 현재까지 진행 내용 (KOREAN)

- [x] 투명, 프레임리스, 항상 위에 있는 데스크톱 펫 창 구성
- [x] 캐릭터 이미지의 알파 채널(투명도)을 감지하여 마우스 이벤트 통과 처리
- [x] 3가지 상호작용 모드 구현 (통과, 상호작용, 유령 모드)
- [x] 전역 단축키(`Cmd/Ctrl+Shift+D`)를 통한 모드 전환 기능
- [x] IPC 기반의 사용자 정의 창 드래그 기능 구현
- [x] Ollama 로컬 AI 연동 (대화 히스토리 + 캐릭터 성격)
- [x] `electron-store`를 사용한 창 위치 및 캐릭터 크기 설정 유지
- [x] 시스템 트레이 메뉴를 통한 앱 종료 및 크기 조절 기능
- [x] **별도 채팅 창 구현** (버블 UI, 드래그 가능, 펫 옆에 위치)
- [x] 채팅 창 자동 위치 조정 (펫 이동 시 따라감)

## 최근 변경 (2026-01-03)

### 아키텍처 변경: 단일 창 → 이중 창

**이전**: 펫 창 안에 터미널 채팅 내장 (react-terminal-ui)

- 문제점: 투명 창 크기 변경 시 레이아웃 깨짐, 텍스트 잘림

**현재**: 펫 창 + 별도 채팅 창

- 펫 창: 투명, 고정 크기, 캐릭터만 표시
- 채팅 창: 불투명, 380x500, 버블 UI
- 장점: 각 창이 독립적, 레이아웃 안정적

### 새 파일

- `src/renderer/chat.html` - 채팅 창 HTML 엔트리
- `src/renderer/src/chat-main.tsx` - 채팅 React 엔트리
- `src/renderer/src/ChatApp.tsx` - 채팅 UI 컴포넌트
- `src/renderer/src/assets/chat.css` - 채팅 스타일

### 삭제된 의존성

- `react-terminal-ui` (터미널 UI 대신 커스텀 버블 UI 사용)
