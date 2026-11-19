# 하늘고양이 카페 V30 | 관리자 인증 및 공용 접수 연결

> V30.2에서는 SQL 없이 로컬 및 지정 GitHub Pages에서 **공개 시연**이 가능합니다. `QA_V30.2.md`를 먼저 확인하세요. 아래 내용은 실제 서버 연결용이며 실제 관리자 인증에 필요합니다.

## 구성

기존 GitHub Pages 주소 및 V29 EmailJS 연결은 유지합니다. 홈페이지 하단 `관리자 로그인`을 클릭하면 `admin.html`의 전용 로그인 화면이 나타납니다. HTML 파일 자체는 공개되지만 Supabase에서 검증하는 관리자 계정만 공용 데이터에 접근할 수 있습니다. 소스 코드에 비밀번호나 비밀 키를 저장하지 않습니다.

### 사용자가 설정할 항목

1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인하고 새 프로젝트를 생성합니다. DB 비밀번호는 본인만 보관합니다.
2. 프로젝트의 SQL Editor → New query에서 `SUPABASE_SETUP.sql`의 전체 내용을 복사한 다음 Run을 누릅니다. 이 SQL은 관리자 허용 목록, 공용 접수 표, RLS, 접수 전용 RPC를 구성합니다. 새 프로젝트 또는 동일한 V30 프로젝트에서만 사용합니다.
3. Authentication → Users → Add user에서 본인의 관리자 이메일과 강력한 새 비밀번호를 등록합니다. 관리자 이메일을 확인된 계정으로 생성합니다. 공개 회원가입은 필요하지 않으므로 Auth 설정에서 신규 가입 허용을 끕니다.
4. 생성한 사용자의 UUID(UID)를 복사합니다. SQL Editor의 새 쿼리에서 아래 코드의 예시 UID를 본인 UID로 교체하고 실행합니다.

```sql
insert into public.skycat_admins(user_id)
values ('YOUR-ADMIN-USER-UUID')
on conflict do nothing;
```

일반 Auth 계정은 로그인에 성공하더라도 이 허용 목록에 없으면 관리자로 접근할 수 없습니다. 관리자 권한을 회수하려면 프로젝트 소유자가 SQL Editor에서 해당 UID의 목록 항목을 제거하면 됩니다.

5. Supabase 프로젝트의 Connect 창 또는 Settings → API Keys에서 Project URL과 Publishable Key를 복사합니다. 새 공개 키(`sb_publishable_...`)만 지원합니다. `sb_secret_...`, service_role, DB 비밀번호, 관리자 비밀번호는 공개 코드에 절대 입력하지 않습니다.
6. VS Code 프로젝트의 `supabase-config.js`를 수정합니다.

```javascript
window.SkyCatCloudConfig = Object.freeze({
  enabled: true,
  url: 'https://YOUR_PROJECT.supabase.co',
  publishableKey: 'sb_publishable_YOUR_PUBLIC_KEY'
});
```

7. 저장 후 Live Server로 `index.html`을 실행합니다. 관리자 로그인에서 등록한 이메일과 비밀번호로 접속합니다. 별도의 관리자 기본 비밀번호는 없습니다. 설정이 비활성화되거나 `file://`로 열면 로그인이 차단됩니다.
8. 프로젝트 전체를 기존 GitHub Pages 저장소의 배포 브랜치/폴더에 업로드합니다. `admin.html`, `admin.js`, `supabase-config.js`, `skycat-cloud.js`와 기존 파일들을 같은 경로에 유지합니다. `SUPABASE_SETUP.sql`은 배포 서버가 실행하는 파일이 아니며, Supabase SQL Editor에서 먼저 실행해야 합니다. 실제 사이트는 HTTP(S)에서 작동합니다.

## 연결 주소

- 메인: https://chughwa-03.github.io/chunghwa-SkyCatCafe/
- 관리자: https://chughwa-03.github.io/chunghwa-SkyCatCafe/admin.html

위 주소는 기존 GitHub Pages 경로를 기준으로 한 배포 목표입니다. GitHub에 V30을 배포한 후 실제 접속을 확인하세요.

## 공용 접수 대시보드

| 기능 | 공용 서버 데이터 |
|---|---|
| 카페 주문 | 가상 주문 참조 번호, 품목/수량/옵션, 원화 합계 |
| 굿즈 주문 | 가상 주문 참조 번호, 상품/수량 및 합계 |
| 예약 | 신청 참조 번호, 방문 날짜·시간, 인원, 좌석 |
| 문의 | 문의 참조 번호와 분류, 사용자가 작성한 문의 내용 |

로그인 시 기본 메뉴는 `공용 접수 대시보드`입니다. 최근 200건을 유형별로 구분하고 접수/처리 중/처리 완료/취소 상태를 저장합니다. 30초마다 권한을 재검증하고, 공용 화면에서 입력 중이 아닐 때 기록을 갱신합니다. 새로고침 버튼도 사용할 수 있습니다.

기존 23개 관리자 메뉴는 로컬 시연용으로 유지되며 각 메뉴에 안내가 표시됩니다. 공용 접수 처리 상태는 로컬 주문 상태·재고·가격·예약 승인·쿠폰을 변경하지 않습니다. 연락처와 결제 정보는 저장하지 않습니다. 문의란에 개인 정보를 입력하지 않도록 안내합니다. 이전 기기에 쌓인 로컬 시연 기록은 자동으로 서버에 업로드하지 않습니다. 새로 접수한 기록으로 확인하세요.

## 실제 연결 QA (사용자 수행)

- 설정 전 admin.html에 직접 접속하면 로그인에 실패하고 대시보드가 열리지 않는지 확인.
- 잘못된 관리자 비밀번호 → 접근 불가.
- 등록되지 않은 일반 인증 계정 → 접근 불가.
- 등록한 관리자 로그인 → 공용 대시보드 진입, 새로고침 후 세션 확인.
- 새 시크릿 창 또는 다른 기기에서 고객 문의를 1회 접수. `공용 서버 접수 완료`와 EmailJS 수신 확인.
- 카페 주문, 굿즈 주문, 예약 각각 새로 진행. 관리자 공용 화면에 4가지 유형 모두 표시되는지 확인.
- 공용 기록 상태 변경 후 다른 관리자 화면에서 새로고침해 반영 확인.
- 로그아웃 후 대시보드 제거와 로그인 재요청 확인.
- 권한 없는 Data API 조회는 데이터가 없거나 권한 거절되는지, 상태 변경은 실패하는지 확인.
- 기존 V29 EmailJS 실제 수신 테스트 및 디자인/가격/언어 기능 회귀 검사.

## 보안 및 운영 범위

- GitHub Pages의 정적 HTML/JavaScript는 공개됩니다. 로그인 화면의 숨김은 접근성 제어일 뿐 실제 데이터 보안은 RLS와 서버 검증으로 보장하도록 설계했습니다. HTML 자체를 비공개로 하려면 인증 프록시 또는 별도 보호 호스팅이 필요합니다.
- 공용 접수 RPC는 익명 사용자에게 신규 시연 데이터 입력만 허용합니다. 직접 조회, 수정, 삭제는 차단되고 관리자 허용 목록에 등록된 계정만 조회와 처리 상태 수정이 가능합니다. 접수 내용은 브라우저 입력으로 신뢰할 수 없는 시연 정보입니다. 실제 가격·재고·예약 검증은 서버에서 다시 구현해야 합니다.
- 공개 시연 사이트의 남용 가능성은 남습니다. SQL에서 분당 공용 접수 건수 제한 및 중복 방지를 설정했지만, 실제 운영에는 CAPTCHA/개별 요청 제한·로그·모니터링·정식 개인정보 정책이 필요합니다. EmailJS 발송 또한 별도의 제한 및 발송 보안 정책을 적용해야 합니다.
- 인증 정보는 관리자 탭의 sessionStorage에만 저장됩니다. 실제 운영에는 XSS 방지, CSP, MFA, 서버 측 세션 관리와 보안 테스트가 필요합니다.
- 실제 Supabase 프로젝트에 SQL을 실행하거나 비밀번호를 설정하는 작업은 본인이 수행해야 합니다. 로컬 작성·모의 응답 검증과 실제 클라우드 검증은 구분합니다.

참고: [Supabase 비밀번호 인증](https://supabase.com/docs/guides/auth/passwords), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [DB 함수](https://supabase.com/docs/guides/database/functions), [공개 키](https://supabase.com/docs/guides/getting-started/api-keys).
