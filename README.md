# my-ai-pet

my-ai-pet은 데스크톱 화면 위를 자유롭게 부유하는 투명한 AI 캐릭터 애플리케이션입니다. Electron과 React를 기반으로 제작되었으며, Ollama를 통한 로컬 AI 채팅과 투명도 기반의 마우스 클릭 통과 기능을 제공합니다.

## 주요 기능

- **투명도 기반 클릭 통과**: 캐릭터의 투명한 영역은 마우스 클릭이 통과되어 뒤쪽의 창을 제어할 수 있습니다.
- **3가지 상호작용 모드**: 상황에 따라 캐릭터의 반응 방식을 전환할 수 있습니다.
- **IPC 기반 윈도우 드래그**: 타이틀 바가 없는 프레임리스 윈도우에서 매끄러운 드래그 이동을 지원합니다.
- **로컬 AI 연동**: Ollama API를 사용하여 오프라인에서도 AI와 대화할 수 있습니다.
- **상태 유지**: 앱 재시작 시에도 마지막 윈도우 위치와 캐릭터 크기를 기억합니다.
- **시스템 트레이**: 트레이 메뉴를 통해 캐릭터 크기 조절(100px~500px) 및 앱 종료가 가능합니다.

## 기술 스택

- **Framework**: Electron 39, React 19
- **Language**: TypeScript
- **Build Tool**: Vite (electron-vite)
- **AI Engine**: Ollama (Local LLM)
- **State Management**: electron-store
- **Styling**: styled-components, Tailwind CSS

## 빠른 시작

### 필수 사항

- [Ollama](https://ollama.com/)가 설치되어 있고 실행 중이어야 합니다.
- `llama3` 또는 설정된 모델이 다운로드되어 있어야 합니다.

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 모드 실행
npm run dev

# 프로덕션 빌드 (Windows)
npm run build:win

# 프로덕션 빌드 (macOS)
npm run build:mac
```

## 핵심 개념

### 1. 알파 채널 마우스 통과 (Alpha Channel Passthrough)

캐릭터가 화면을 가리지 않으면서도 특정 부분만 클릭 가능하게 만드는 핵심 메커니즘입니다.

- **동작 원리**: `usePixelTransparency.ts`에서 캐릭터 이미지를 투명한 Canvas에 그립니다.
- **감지**: 마우스가 움직일 때마다 현재 좌표의 픽셀 알파(Alpha) 값을 확인합니다.
- **제어**:
  - 알파 값 = 0 (투명): `setIgnoreMouseEvents(true, { forward: true })`를 호출하여 클릭이 뒤로 통과되도록 합니다.
  - 알파 값 > 0 (불투명): `setIgnoreMouseEvents(false)`를 호출하여 캐릭터가 클릭을 받도록 합니다.

### 2. 상호작용 모드 (Interaction Modes)

사용자 환경에 따라 캐릭터의 간섭 정도를 조절합니다. 전역 단축키 `Cmd/Ctrl + Shift + D`로 순환 전환할 수 있습니다.

- **passthrough (기본)**: 알파 채널 기반 감지가 활성화됩니다. 캐릭터 몸체만 클릭 가능합니다.
- **interactive**: 투명도와 상관없이 윈도우 전체 영역이 클릭을 받습니다. 채팅 입력 시 유리합니다.
- **ghost**: 모든 마우스 이벤트를 무시합니다. 캐릭터는 보이지만 뒤쪽 작업에 전혀 방해를 주지 않습니다.

### 3. IPC 기반 윈도우 드래그 (IPC Window Dragging)

투명/프레임리스 윈도우에서는 표준 `-webkit-app-region: drag` 사용 시 마우스 이벤트 통과 기능과 충돌이 발생할 수 있어 커스텀 로직을 사용합니다.

- **동작 원리**:
  1. Renderer에서 `mousedown` 발생 시 `start-drag` IPC 전송
  2. Main Process에서 현재 마우스 커서 위치와 윈도우 위치 기록
  3. 16ms(60fps) 주기로 커서의 이동량(Delta)을 계산하여 `win.setBounds`로 윈도우 위치 갱신
  4. `mouseup` 발생 시 `stop-drag` IPC로 트래킹 중단

## 프로젝트 구조

```text
src/
├── main/
│   ├── services/           # AI 연동 및 비즈니스 로직
│   └── index.ts            # 메인 프로세스, 윈도우 및 IPC 설정
├── preload/
│   └── index.ts            # 렌더러-메인 간 브리지 API 정의
└── renderer/src/
    ├── assets/             # 캐릭터 리소스 및 CSS
    ├── components/         # React 컴포넌트 (ChatBubble 등)
    ├── hooks/              # 핵심 로직 (투명도, 드래그, 모드 관리)
    ├── App.tsx             # 루트 컴포넌트
    └── main.tsx            # 엔트리 포인트
```

## IPC API Reference

| Channel                    | Method   | Description                           |
| :------------------------- | :------- | :------------------------------------ |
| `set-ignore-mouse-events`  | `send`   | 윈도우의 마우스 이벤트 무시 여부 설정 |
| `start-drag` / `stop-drag` | `send`   | 커스텀 윈도우 드래그 시작/종료        |
| `get-interaction-mode`     | `invoke` | 현재 상호작용 모드 조회               |
| `set-interaction-mode`     | `send`   | 상호작용 모드 변경                    |
| `chat`                     | `invoke` | Ollama AI와 대화 수행                 |
| `get-character-size`       | `invoke` | 저장된 캐릭터 크기 조회               |

## 개발 가이드

- **코드 스타일**: 세미콜론 미사용, 홑따옴표(`'`) 사용, 2스페이스 들여쓰기를 권장합니다.
- **경로 별칭**: `@renderer/*`를 사용하여 `src/renderer/src/*` 경로에 접근할 수 있습니다.
- **투명도 유지**: 윈도우 배경에 불투명한 색상을 지정하지 않도록 주의하십시오. 모든 UI 요소는 `App.tsx` 내에서 절대 좌표로 배치됩니다.
