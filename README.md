# my-ai-pet

An Electron application with React and TypeScript

## 현재까지 진행 내용

- 투명/프레임리스/항상 위에 있는 데스크톱 펫 창 구성
- 캐릭터 이미지(GIF) 렌더링 및 알파 채널 기반 마우스 이벤트 통과 처리
- `preload`에서 `setIgnoreMouseEvents` IPC API 노출
- 메인 프로세스에서 마우스 이벤트 무시/해제 IPC 핸들링

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```
