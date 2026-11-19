# 공용 컴포넌트

V31 · HTML / CSS / JavaScript

| 컴포넌트 | 클래스 | 목적 |
|---|---|---|
| 디자인 토큰 | `--sc-*` | 공통 4·8·12·16·24·32px 간격, 콘텐츠 폭, 헤더 높이 |
| 닫기 버튼 | `.sc-close` | 44×44px, 중앙 정렬된 X, 포커스 표시 |
| 버튼 | `.sc-button` | 최소 44px 높이, 긴 문구 줄바꿈 |
| 버튼 묶음 | `.sc-actions` | 8px 간격, 좁은 화면에서 줄바꿈 |
| 팝업 헤더 | `.sc-dialog-head` | 제목과 닫기 버튼 정렬, 12px 간격 |
| 입력 필드 | `.sc-field` | 입력창과 라벨의 간격, 폭 제한 |

## 사용법

기존 페이지 CSS 뒤에 다음을 추가합니다.

```html
<link rel="stylesheet" href="./skycat-components.css">
<script defer src="./skycat-components.js"></script>
```

공통 CSS는 기존 색상과 버튼 기능을 바꾸지 않습니다. 기존 클릭 이벤트, href, id는 유지하세요.

```html
<div class="sc-dialog-head">
  <h2>상품 상세</h2>
  <button class="sc-close" type="button" aria-label="상품 상세 닫기">×</button>
</div>
<label class="sc-field">
  이메일
  <input type="email" autocomplete="email">
</label>
<div class="sc-actions">
  <button class="sc-button" type="button">취소</button>
  <button class="sc-button" type="submit">확인</button>
</div>
```

공용 JS는 기존 사진 확대 화면에서 사용하는 label형 닫기 버튼의 Enter/Space 키 동작만 추가합니다. 실제 팝업의 열기·닫기 기능은 기존 각 페이지 JS가 담당합니다.

`skycat-component-integration.css`는 사이트별 위치 조정용 파일입니다. 다른 사이트에 컴포넌트만 가져갈 때는 공용 CSS/JS만 필요합니다.

`components-preview.html`은 별도 컴포넌트 ZIP의 단독 확인용 페이지입니다.
