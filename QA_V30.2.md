# V30.2 GitHub Pages 관리자 시연 로그인 검수

## 원인 및 변경

V30.1 관리자는 Supabase 미연결 상태에서 localhost/file 주소에서만 테스트 로그인을 허용했으므로 지정 GitHub Pages에서도 버튼이 비활성화되었습니다. V30.2는 `admin-test-config.js`의 `allowPublicDemo: true` 설정과 정확한 HTTPS 호스트/관리자 파일 경로를 확인하여 공개 포트폴리오 시연을 허용합니다.

공개 시연 계정은 **실제 보안 인증이 아닙니다.** 브라우저 소스에서 테스트 비밀번호를 확인할 수 있으므로 개인 비밀번호를 사용하지 말고 실제 고객/운영 정보를 입력하지 마세요. 공용 DB 요청은 수행하지 않으며, 로컬 관리 기능 23개만 사용합니다. Supabase를 활성화하면 시연 계정은 비활성화됩니다.

## GitHub 배포 후 사용자 검사

1. 기존 저장소의 Pages 배포 폴더에 V30.2 파일들을 업로드하고 Pages 배포 완료를 확인하세요. V30.1 사용자부터는 `admin.html`, `admin.js`, `admin-test-config.js` 3개를 함께 교체하면 됩니다(기존 설정값을 수정했다면 새 설정에 반영).
2. https://chughwa-03.github.io/chunghwa-SkyCatCafe/ → 공식 홈페이지 → 하단 관리자 로그인.
3. 관리자 URL: https://chughwa-03.github.io/chunghwa-SkyCatCafe/admin.html. 로그인 화면 버전 V30.2, 공개 시연 로그인 안내, 활성화된 로그인 버튼을 확인합니다.
4. 잘못된 비밀번호 입력 → 진입 거부. 올바른 공개 시연 계정(`admin@skycatcafe.com` / `SkyCat2026!`) 입력 → 같은 admin.html의 `#dashboard`에 기존 관리자 콘텐츠 표시.
5. 23개 로컬 메뉴, 고객/관리자 (같은 브라우저·동일 주소) 데이터 연동, 로그아웃 및 새로고침 재로그인 검사.
6. 공용 접수 메뉴 → 연결 보류 안내. 실제 로그인 및 DB 데이터는 Supabase 설정 이후 검수합니다.
7. 기존 V30.1 화면이 남는 경우 Ctrl+F5로 강력 새로고침. V30.2 HTML 열기 및 JS 파일 3개 동시 교체 여부를 확인합니다.

공개 시연을 중단하려면 `allowPublicDemo: false`로 변경하고 다시 배포하세요. 실제 서버 비밀번호를 코드에 저장해서는 안 됩니다.

## 모의 검사

`node tests/admin-ui.test.cjs` 및 `local`, `file`, `localhost`, `ipv6`, `custom`, `remote`, `lookalike`, `disabled`, `configured`, `public`, `public-disabled`, `public-configured`, `public-wrong-path`, `public-http`, `public-wrong-port` 인수별 검사. 공개 URL과 나머지 환경, 오입력 차단, 올바른 로그인 및 기존 메뉴 렌더, 로그아웃, Supabase 우선, 공용 요청 미발생을 확인합니다.

- 위 16개 관리자 시나리오 모두 통과. 기존 클라우드·EmailJS 및 독립 연동 모의 검사도 통과.
- JS 문법 검사 및 ZIP 무결성 검사 통과.

실제 GitHub 저장소에 배포하지 않았으며 실제 배포 브라우저 검수는 사용자 수행 대상입니다.
