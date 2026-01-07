# PROJECT KNOWLEDGE BASE

**Last Updated:** 2026-01-08
**Project:** my-ai-pet
**Status:** Tauri (완료) - Phase 0 마이그레이션 완료

---

## PROJECT OVERVIEW

개발자를 위한 AI 데스크톱 펫 애플리케이션. 투명 창에서 캐릭터가 떠다니며, 로컬 환경을 인식하고 능동적으로 도움을 주는 것이 목표.

**핵심 차별화:**

- 개발자 특화 기능 (에러 분석, Git 알림, 빌드 모니터링)
- MCP 기반 확장성 (filesystem, git, web-search)
- 멀티 LLM 프로바이더 (Ollama, OpenAI, Anthropic)
- 고성능 (Tauri - 번들 10배 감소)

---

## CURRENT STATE (Tauri)

### 구현 완료

| 기능                         | 파일                          |
| ---------------------------- | ----------------------------- |
| 투명 펫 창                   | `src-tauri/src/lib.rs`        |
| 3가지 상호작용 모드          | `hooks/useInteractionMode.ts` |
| 글로벌 단축키 (Cmd+Shift+D)  | `src-tauri/src/lib.rs`        |
| 창 드래그                    | `hooks/useWindowDrag.ts`      |
| 별도 채팅 창 (버블 UI)       | `ChatApp.tsx`                 |
| Ollama AI 연동               | `src-tauri/src/lib.rs`        |
| 대화 히스토리 (메모리, 10개) | `src-tauri/src/lib.rs`        |
| 시스템 트레이                | `src-tauri/src/lib.rs`        |
| 캐릭터 크기 조절             | `hooks/useCharacterSize.ts`   |

### 현재 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                     Desktop AI Pet v0.1 (Tauri)                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐                                     │
│  │Pet Window│  │Chat Win  │                                     │
│  │(투명)    │  │(Bubble)  │                                     │
│  └────┬─────┘  └────┬─────┘                                     │
│       └─────────────┘                                            │
│              │ Tauri Commands                                    │
│  ┌───────────┴───────────────────────────────────────────────┐  │
│  │                    Tauri Main (Rust)                       │  │
│  │                                                            │  │
│  │  Commands:                                                 │  │
│  │  - set_ignore_mouse_events   - toggle_chat                 │  │
│  │  - start_drag                - close_chat                  │  │
│  │  - get/set_interaction_mode  - chat (Ollama)               │  │
│  │  - get/set_character_size                                  │  │
│  │                                                            │  │
│  │  Plugins:                                                  │  │
│  │  - tauri-plugin-global-shortcut                            │  │
│  │  - tauri-plugin-store                                      │  │
│  │  - tauri-plugin-log                                        │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## IMPLEMENTATION ROADMAP

### Phase 0: Tauri 마이그레이션 ✅ 완료

- [x] Tauri 프로젝트 초기화
- [x] React 프론트엔드 이전
- [x] IPC 통신 재작성 (Rust)
- [x] 투명 창 구현
- [x] 글로벌 단축키 구현
- [x] 시스템 트레이 구현
- [x] Electron 코드 정리

### Phase 1: 멀티 LLM 프로바이더 (1.5주)

- [ ] 프로바이더 추상화 (Rust trait)
- [ ] OpenAI, Anthropic 프로바이더 추가
- [ ] 스트리밍 응답
- [ ] 설정 UI

### Phase 2: MCP 연동 (2주)

- [ ] tauri-plugin-mcp (Airi 참고)
- [ ] filesystem, git, web-search 서버

### Phase 3: 캐릭터 & UX (1.5주)

- [ ] Live2D 또는 Lottie 애니메이션
- [ ] Caption 창 (말풍선)

### Phase 4: 개발자 기능 (1.5주)

- [ ] 클립보드 에러 감지
- [ ] Git 상태 알림
- [ ] 프로젝트 컨텍스트 자동 인식

---

## FILE STRUCTURE

```
src/
└── renderer/
    ├── index.html
    ├── chat.html
    └── src/
        ├── assets/
        │   ├── characters/
        │   ├── base.css
        │   ├── chat.css
        │   └── main.css
        ├── hooks/
        │   ├── index.ts
        │   ├── useCharacterSize.ts
        │   ├── useInteractionMode.ts
        │   ├── usePixelTransparency.ts
        │   └── useWindowDrag.ts
        ├── lib/
        │   └── tauri-api.ts
        ├── App.tsx
        ├── ChatApp.tsx
        ├── chat-main.tsx
        ├── env.d.ts
        └── main.tsx

src-tauri/
├── src/
│   ├── lib.rs           # 메인 로직, 커맨드, 트레이
│   └── main.rs          # 엔트리포인트
├── capabilities/
│   └── default.json     # 권한 설정
├── icons/
├── Cargo.toml
└── tauri.conf.json
```

---

## TAURI COMMANDS

| Command                   | Description                  |
| ------------------------- | ---------------------------- |
| `set_ignore_mouse_events` | 마우스 이벤트 무시 여부 설정 |
| `start_drag`              | 창 드래그 시작               |
| `get_interaction_mode`    | 현재 상호작용 모드 조회      |
| `set_interaction_mode`    | 상호작용 모드 변경           |
| `get_character_size`      | 캐릭터 크기 조회             |
| `set_character_size`      | 캐릭터 크기 변경             |
| `toggle_chat`             | 채팅 창 토글                 |
| `close_chat`              | 채팅 창 닫기                 |
| `chat`                    | Ollama AI와 대화             |

---

## DEVELOPMENT COMMANDS

```bash
npm run dev          # Vite 개발 서버
npm run tauri:dev    # Tauri 개발 모드
npm run tauri:build  # 프로덕션 빌드
npm run lint         # ESLint
npm run typecheck    # TypeScript 체크
```

---

## CONVENTIONS

- **Style**: No semicolons, single quotes, 100 char limit, 2-space indent
- **Path Alias**: `@renderer/*` for `src/renderer/src/*`
- **API**: All via `window.api` (tauri-api.ts wrapper)
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

---

## KEY DECISIONS

| 결정       | 선택            | 이유                           |
| ---------- | --------------- | ------------------------------ |
| 프레임워크 | Tauri           | 성능 (번들 10배↓, 메모리 4배↓) |
| AI         | 멀티 프로바이더 | 유연성 (사용자 선택)           |
| 확장성     | MCP             | 표준 프로토콜, Airi 검증됨     |
| 음성       | 제외            | 텍스트 집중, 복잡도 감소       |

---

## DOCUMENTATION

상세 기획서: `docs/PLANNING.md`
