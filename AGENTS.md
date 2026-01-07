# PROJECT KNOWLEDGE BASE

**Last Updated:** 2026-01-08
**Project:** my-ai-pet
**Status:** Electron (현재) → Tauri 마이그레이션 예정

---

## PROJECT OVERVIEW

개발자를 위한 AI 데스크톱 펫 애플리케이션. 투명 창에서 캐릭터가 떠다니며, 로컬 환경을 인식하고 능동적으로 도움을 주는 것이 목표.

**핵심 차별화:**

- 개발자 특화 기능 (에러 분석, Git 알림, 빌드 모니터링)
- MCP 기반 확장성 (filesystem, git, web-search)
- 멀티 LLM 프로바이더 (Ollama, OpenAI, Anthropic)
- 고성능 (Tauri - 번들 10배 감소 예정)

---

## CURRENT STATE (Electron)

### 구현 완료

| 기능                         | 파일                            |
| ---------------------------- | ------------------------------- |
| 투명 펫 창                   | `src/main/index.ts`             |
| 알파 채널 클릭 통과          | `hooks/usePixelTransparency.ts` |
| 3가지 상호작용 모드          | `hooks/useInteractionMode.ts`   |
| 글로벌 단축키 (Cmd+Shift+D)  | `src/main/index.ts`             |
| IPC 창 드래그                | `hooks/useWindowDrag.ts`        |
| 별도 채팅 창 (버블 UI)       | `ChatApp.tsx`                   |
| Ollama AI 연동               | `services/ollamaService.ts`     |
| 대화 히스토리 (메모리, 10개) | `services/ollamaService.ts`     |
| 시스템 트레이                | `src/main/index.ts`             |
| 설정 저장 (창 위치, 크기)    | `electron-store`                |

### 현재 아키텍처

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Main Process (Electron)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  Pet Window (BrowserWindow)          Chat Window (BrowserWindow)            │
│  - transparent: true                 - transparent: false                   │
│  - frame: false                      - frame: false                         │
│  - alwaysOnTop: true                 - alwaysOnTop: true                    │
│         │                                    │                              │
│         └──────────── IPC ───────────────────┘                              │
│                       │                                                     │
│  ┌────────────────────┴────────────────────┐                                │
│  │ IPC Handlers                            │                                │
│  │ - toggle-chat / close-chat              │                                │
│  │ - set-ignore-mouse-events               │                                │
│  │ - chat (Ollama)                         │                                │
│  └─────────────────────────────────────────┘                                │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                        [Preload Bridge]
                              │
┌─────────────────────────────┴───────────────────────────────────────────────┐
│                           Renderer (React)                                  │
├──────────────────────────────────┬──────────────────────────────────────────┤
│  Pet Window (index.html)         │  Chat Window (chat.html)                 │
│  - App.tsx                       │  - ChatApp.tsx                           │
│  - usePixelTransparency          │  - Message bubbles                       │
│  - useWindowDrag                 │  - Input field                           │
│  - useInteractionMode            │  - Auto-scroll                           │
└──────────────────────────────────┴──────────────────────────────────────────┘
```

---

## PLANNED STATE (Tauri)

### 목표 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                     Desktop AI Pet v1.0 (Tauri)                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │Pet Window│  │Chat Win  │  │Caption   │  │Settings  │        │
│  │(Live2D)  │  │(Bubble)  │  │(말풍선)  │  │(설정 UI) │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
│       └─────────────┴─────────────┴─────────────┘               │
│                           │ IPC                                  │
│  ┌────────────────────────┴────────────────────────────────┐    │
│  │                    Tauri Main (Rust)                     │    │
│  │                                                          │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │              AI Orchestrator                     │    │    │
│  │  │  Providers: Ollama │ OpenAI │ Anthropic         │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  │                                                          │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │              MCP Clients                         │    │    │
│  │  │  filesystem │ git │ web-search                  │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  │                                                          │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │              System Monitors                     │    │    │
│  │  │  Clipboard │ Git Watcher │ Terminal             │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

### 성능 목표

| 지표        | Electron (현재) | Tauri (목표) |
| ----------- | --------------- | ------------ |
| 번들 크기   | ~150MB          | <15MB        |
| 메모리 사용 | ~200MB          | <80MB        |
| 시작 시간   | ~3초            | <1초         |

---

## IMPLEMENTATION ROADMAP

### Phase 0: Tauri 마이그레이션 (2주)

- Tauri 프로젝트 초기화
- React 프론트엔드 이전
- IPC 통신 재작성 (Rust)
- 투명 창 + 클릭 통과 구현

### Phase 1: 멀티 LLM 프로바이더 (1.5주)

- 프로바이더 추상화 (Rust trait)
- Ollama, OpenAI, Anthropic 프로바이더
- 스트리밍 응답
- 설정 UI

### Phase 2: MCP 연동 (2주)

- tauri-plugin-mcp (Airi 참고)
- filesystem, git, web-search 서버

### Phase 3: 캐릭터 & UX (1.5주)

- Live2D 또는 Lottie 애니메이션
- Caption 창 (말풍선)

### Phase 4: 개발자 기능 (1.5주)

- 클립보드 에러 감지
- Git 상태 알림
- 프로젝트 컨텍스트 자동 인식

**총 예상 기간:** 8주

---

## FILE STRUCTURE

### 현재 (Electron)

```
src/
├── main/
│   ├── services/
│   │   └── ollamaService.ts
│   └── index.ts
├── preload/
│   ├── index.ts
│   └── index.d.ts
└── renderer/
    ├── index.html
    ├── chat.html
    └── src/
        ├── assets/
        ├── hooks/
        ├── App.tsx
        ├── ChatApp.tsx
        ├── main.tsx
        └── chat-main.tsx
```

### 목표 (Tauri)

```
src/                          # 프론트엔드 (React)
├── windows/
│   ├── pet/
│   ├── chat/
│   ├── caption/
│   └── settings/
└── ...

src-tauri/                    # 백엔드 (Rust)
├── src/
│   ├── commands/
│   ├── ai/
│   │   ├── provider.rs
│   │   ├── ollama.rs
│   │   ├── openai.rs
│   │   └── anthropic.rs
│   ├── mcp/
│   └── monitors/
├── Cargo.toml
└── tauri.conf.json
```

---

## IPC API REFERENCE (현재)

| Channel                    | Method   | Description                  |
| -------------------------- | -------- | ---------------------------- |
| `set-ignore-mouse-events`  | `send`   | 마우스 이벤트 무시 여부 설정 |
| `start-drag` / `stop-drag` | `send`   | 커스텀 윈도우 드래그         |
| `get-interaction-mode`     | `invoke` | 현재 상호작용 모드 조회      |
| `set-interaction-mode`     | `send`   | 상호작용 모드 변경           |
| `toggle-chat`              | `send`   | 채팅 창 토글                 |
| `close-chat`               | `send`   | 채팅 창 닫기                 |
| `chat`                     | `invoke` | Ollama AI와 대화             |
| `get-character-size`       | `invoke` | 캐릭터 크기 조회             |

---

## DEVELOPMENT COMMANDS

```bash
npm run dev          # 개발 모드
npm run build        # 프로덕션 빌드
npm run build:mac    # macOS DMG
npm run lint         # ESLint
npm run typecheck    # TypeScript 체크
```

---

## CONVENTIONS

- **Style**: No semicolons, single quotes, 100 char limit, 2-space indent
- **Path Alias**: `@renderer/*` for `src/renderer/src/*`
- **IPC**: All via `window.api` bridge
- **Type Safety**: No `as any`, `@ts-ignore`

---

## REFERENCE PROJECTS

### Airi (16.6k⭐)

- **Repo**: https://github.com/moeru-ai/airi
- **Stack**: Tauri + Vue 3
- **참고할 것**:
  - `tauri-plugin-mcp` (MCP 연동)
  - `tauri-plugin-window-pass-through-on-hover` (클릭 통과)
  - Live2D 캐릭터 렌더링
  - 멀티 LLM 프로바이더 패턴

### Oh My OpenCode

- **Repo**: https://github.com/code-yeongyu/oh-my-opencode
- **참고할 것**:
  - AI 오케스트레이션 패턴
  - 멀티 에이전트 라우팅
  - MCP 서버 통합

---

## KEY DECISIONS

| 결정       | 선택             | 이유                           |
| ---------- | ---------------- | ------------------------------ |
| 프레임워크 | Electron → Tauri | 성능 (번들 10배↓, 메모리 4배↓) |
| AI         | 멀티 프로바이더  | 유연성 (사용자 선택)           |
| 확장성     | MCP              | 표준 프로토콜, Airi 검증됨     |
| 음성       | 제외             | 텍스트 집중, 복잡도 감소       |

---

## DOCUMENTATION

상세 기획서: `docs/PLANNING.md`
