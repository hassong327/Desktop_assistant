# Desktop AI Pet - 구현 계획서

**작성일:** 2026-01-02
**프로젝트:** my-ai-pet (데스크톱 AI 펫 어시스턴트)

---

## 현재 완료된 작업

### 기본 인프라

- [x] 투명/프레임리스/항상 위 창 구성
- [x] 캐릭터 이미지 렌더링 (PNG/GIF 지원)
- [x] 알파 채널 기반 마우스 이벤트 통과 처리
- [x] IPC 기반 수동 드래그 시스템
- [x] 동적 창 크기 조절 (이미지 크기에 맞춤)
- [x] 모듈화된 훅 아키텍처 (`usePixelTransparency`, `useWindowDrag`)

### 현재 기술 스택

- **프레임워크:** Electron + React + TypeScript
- **빌드:** electron-vite
- **스타일링:** Tailwind CSS v4
- **사용 가능한 의존성:** styled-components, lottie-react, electron-store (미사용)

---

## 구현 예정 기능

### Phase 1: 인터랙션 모드 토글 (우선순위: 높음)

#### 1.1 전역 단축키 시스템

**수정 파일:** `src/main/index.ts`, `src/preload/index.ts`

**구현 내용:**

- Electron `globalShortcut` 모듈 사용
- 단축키: `Cmd+Shift+D` (Mac) / `Ctrl+Shift+D` (Win/Linux)
- IPC 핸들러: `toggle-interaction-mode`
- 메인 프로세스에서 모드 상태 관리

**예상 코드:**

```typescript
// main/index.ts
import { globalShortcut } from 'electron'

let interactionMode: 'passthrough' | 'interactive' = 'passthrough'

globalShortcut.register('CommandOrControl+Shift+D', () => {
  interactionMode = interactionMode === 'passthrough' ? 'interactive' : 'passthrough'
  mainWindow.webContents.send('interaction-mode-changed', interactionMode)
})
```

#### 1.2 인터랙션 모드 상태 관리

**생성 파일:** `src/renderer/src/hooks/useInteractionMode.ts`
**수정 파일:** `src/renderer/src/hooks/usePixelTransparency.ts`

**구현 내용:**

- 모드 상태: `'passthrough' | 'interactive' | 'dragging'`
- `usePixelTransparency`에 `enabled` 파라미터 연동
- IPC 통신을 통한 모드 전환

#### 1.3 시각적 모드 표시

**수정 파일:** `src/renderer/src/App.tsx`, `src/renderer/src/assets/main.css`

**구현 내용:**

- 모드별 시각적 표시 (테두리 글로우, 투명도 변화)
- 커서 상태 변경
- 페이드 인/아웃 트랜지션

---

### Phase 2: AI 통합 (우선순위: 높음)

#### 2.1 AI 서비스 아키텍처

**생성 파일:** `src/main/services/aiService.ts`

**구현 내용:**

- 추상화된 AI 서비스 인터페이스
- 다중 프로바이더 지원 (OpenAI, Anthropic, 로컬 모델)
- 환경 변수 설정
- 에러 핸들링 및 폴백

**예상 구조:**

```typescript
interface AIService {
  chat(message: string): Promise<string>
  stream(message: string): AsyncGenerator<string>
}

class OpenAIService implements AIService { ... }
class AnthropicService implements AIService { ... }
```

#### 2.2 검색 통합

**생성 파일:** `src/main/services/searchService.ts`

**구현 내용:**

- 실시간 웹 검색 연동
- 검색 결과 캐싱 및 포맷팅
- 관련성 필터링

#### 2.3 채팅/인터랙션 UI

**생성 파일:**

- `src/renderer/src/components/ChatBubble.tsx`
- `src/renderer/src/components/InteractionPanel.tsx`

**수정 파일:** `src/renderer/src/App.tsx`

**구현 내용:**

- 확장 가능한 채팅 인터페이스
- 말풍선 디자인 (lottie-react 애니메이션 활용)
- 키보드 입력 처리 및 명령어 인식

---

### Phase 3: 알림 시스템 (우선순위: 중간)

#### 3.1 알림 아키텍처

**생성 파일:** `src/main/services/notificationService.ts`

**구현 내용:**

- 알림 타입: info, warning, alert, reminder
- 우선순위 큐 시스템
- 네이티브 OS 알림 연동
- 캐릭터 위 시각적 알림 오버레이

#### 3.2 예약 작업 및 리마인더

**생성 파일:** `src/main/services/schedulerService.ts`

**구현 내용:**

- Cron 스타일 스케줄링
- `electron-store` 활용 영구 저장
- 백그라운드 작업 관리

---

### Phase 4: 상태 관리 및 저장 (우선순위: 낮음)

#### 4.1 사용자 설정

**생성 파일:** `src/main/services/storeService.ts`

**구현 내용:**

- 설정 영구 저장 (위치, 모드 설정, AI 프로바이더)
- 채팅 히스토리 저장
- 사용자 커스터마이징 옵션

---

## 기술 결정 사항

### IPC 통신 패턴

```typescript
// 추가할 메인 프로세스 API:
'toggle-interaction-mode' // passthrough/interactive 전환
'get-ai-response' // 사용자 질문 처리
'schedule-notification' // 리마인더 설정
'get-user-preferences' // 저장된 설정 조회
'set-user-preferences' // 설정 저장
```

### 추가 필요 의존성

| 패키지                            | 용도      |
| --------------------------------- | --------- |
| `openai` 또는 `@anthropic-ai/sdk` | AI 통합   |
| `axios` (선택)                    | HTTP 요청 |

### 기존 활용 가능 의존성

| 패키지                    | 용도              | 현재 상태       |
| ------------------------- | ----------------- | --------------- |
| `electron.globalShortcut` | 전역 단축키       | 내장            |
| `electron.Notification`   | 시스템 알림       | 내장            |
| `electron-store`          | 영구 저장소       | 설치됨 (미사용) |
| `lottie-react`            | 애니메이션        | 설치됨 (미사용) |
| `styled-components`       | 컴포넌트 스타일링 | 설치됨 (미사용) |

---

## 사용자 경험 흐름

```
[기본 모드: Passthrough]
     │
     │ Cmd+Shift+D
     ▼
[인터랙티브 모드]
     │
     │ 캐릭터 클릭
     ▼
[채팅 UI 열림]
     │
     │ 질문 입력
     ▼
[AI 응답 표시]
     │
     │ 타임아웃 또는 ESC
     ▼
[기본 모드로 복귀]
```

---

## 파일 구조 (예정)

```
src/
├── main/
│   ├── index.ts                 # 수정: 단축키, 모드 관리
│   └── services/
│       ├── aiService.ts         # 신규: AI 통합
│       ├── searchService.ts     # 신규: 검색
│       ├── notificationService.ts # 신규: 알림
│       ├── schedulerService.ts  # 신규: 스케줄러
│       └── storeService.ts      # 신규: 저장소
├── preload/
│   └── index.ts                 # 수정: 새 API 노출
└── renderer/src/
    ├── App.tsx                  # 수정: 모드 연동
    ├── components/
    │   ├── ChatBubble.tsx       # 신규: 말풍선 UI
    │   └── InteractionPanel.tsx # 신규: 채팅 패널
    └── hooks/
        ├── useInteractionMode.ts # 신규: 모드 관리
        ├── usePixelTransparency.ts # 수정: enabled 연동
        └── useWindowDrag.ts     # 기존 유지
```

---

## 구현 순서

| 순서 | 작업                    | 의존성      | 예상 시간 |
| ---- | ----------------------- | ----------- | --------- |
| 1    | 전역 단축키 + 모드 토글 | 없음        | 1-2시간   |
| 2    | 시각적 모드 표시        | #1 완료     | 30분      |
| 3    | AI 서비스 기초          | 없음        | 2-3시간   |
| 4    | 채팅 UI 컴포넌트        | #1, #3 완료 | 2-3시간   |
| 5    | 알림 시스템             | #1 완료     | 2시간     |
| 6    | 설정 저장소             | 없음        | 1시간     |

---

## 결정 필요 사항

구현 시작 전 확인이 필요한 항목:

1. **AI 프로바이더**: OpenAI vs Anthropic vs 로컬 모델?
2. **단축키**: `Cmd+Shift+D` 사용 OK?
3. **시각적 표시**: 글로우 vs 테두리 vs 투명도 변화?
4. **채팅 UI**: 말풍선 vs 별도 패널?

---

## 참고 사항

- 기존 코드 스타일 유지 (세미콜론 없음, 싱글 쿼터, 2스페이스 인덴트)
- `@renderer/*` 경로 별칭 사용
- 타입 안전성 유지 (`as any`, `@ts-ignore` 금지)
