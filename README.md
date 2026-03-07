# AI/AX Service Planner Portfolio (Vue 3)

원페이지 형태의 AI/AX 서비스 기획자 포트폴리오 템플릿입니다.

## 실행

```bash
npm install
npm run dev
```

## 구성

- 텍스트 데이터: `src/data/portfolio.json`
- 이미지 에셋: `src/assets/images`
- 메인 페이지: `src/App.vue`
- 스타일: `src/styles.css`

## 내 정보로 교체하는 방법

1. `src/data/portfolio.json`의 텍스트/수치/커리어/프로젝트 내용을 수정합니다.
2. `src/assets/images` 안의 SVG 파일을 본인 이미지로 교체합니다.
3. 프로젝트 이미지 키를 바꾸고 싶으면 `src/App.vue`의 `imageMap`에 파일을 연결하면 됩니다.

## 빌드

```bash
npm run build
npm run preview
```