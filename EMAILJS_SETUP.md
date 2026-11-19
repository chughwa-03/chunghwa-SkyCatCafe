# 하늘고양이 카페 V29 | EmailJS 연결 가이드

## 1. 현재 상태

V29의 연동 코드와 테스트는 준비되어 있습니다. 실제 이메일 발송은 계정 연결 후에만 가능합니다. 초기 설정은 `enabled: false`이므로 모든 페이지는 종전처럼 가상 체험 기록만 저장합니다. 실제 주문, 결제, 예약이나 배송은 발생하지 않습니다.

## 2. EmailJS 계정 설정

1. [EmailJS](https://www.emailjs.com/)에 접속해 계정을 준비합니다.
2. Email Services에서 본인이 관리하는 이메일 서비스를 연결합니다. 표시된 Service ID를 기록합니다.
3. Email Templates에서 새 템플릿을 만듭니다. 아래 내용으로 설정합니다.
   - To Email: 본인이 수신할 운영자 이메일 주소를 **고정값**으로 입력합니다. 방문자가 주소를 지정하게 하지 않습니다.
   - From Name: Sky Cat Cafe
   - Reply To: 필요할 경우 운영자 계정 주소로 고정합니다. 방문자 이메일을 수집하지 않습니다.
   - Subject: `[Sky Cat Cafe · DEMO] {{event_label}} / {{reference}}`
   - Content: 아래 템플릿 복사.
4. Template ID를 기록합니다.
5. Account에서 Public Key를 확인합니다. Private Key나 비밀번호는 코드에 입력하지 않습니다.
6. EmailJS 설정에서 브라우저 요청이 허용되어 있는지 확인하고, 가능하면 실제 사이트 Origin만 허용하도록 제한합니다. 로컬 검증에는 Live Server의 정확한 Origin을 사용합니다(예: http://127.0.0.1:5500 또는 http://localhost:5500). GitHub Pages 배포 시에는 해당 HTTPS Origin을 허용합니다(경로 제외).
7. 발송 한도와 이용 조건은 본인의 EmailJS 대시보드에서 확인합니다. 공개 웹사이트는 이메일 발송 남용 방지를 위한 별도 보호(예: 서버 검증, CAPTCHA와 그에 맞는 클라이언트 구현)가 필요합니다. 이 포트폴리오에는 CAPTCHA가 구현되어 있지 않습니다.

### 복사할 템플릿 본문

EmailJS 템플릿 편집기에 아래를 붙여넣습니다. HTML 편집기를 사용하는 경우에도 사용자 입력은 반드시 이중 중괄호를 사용해 이스케이프합니다.

```html
<div style="font-family:Arial,sans-serif;color:#1f4561">
  <h2 style="color:#267eae">Sky Cat Cafe | 운영 알림</h2>
  <p>{{demo_notice}}</p>
  <p>알림 유형: {{event_label}}</p>
  <p>접수 번호: {{reference}}</p>
  <p>접수 시간(UTC): {{created_at}}</p>
  <p>사용 언어: {{language}}</p>
  <div style="white-space:pre-wrap;padding:12px;background:#edf8ff">{{details}}</div>
  <p>최종 합계(원화 기준): {{total_krw}}</p>
</div>
```

## 3. VS Code 설정

ZIP을 압축 해제하고 `emailjs-config.js`를 엽니다.

```js
window.SkyCatEmailConfig = Object.freeze({
  enabled: true,
  serviceId: '본인의_Service_ID',
  templateId: '본인의_Template_ID',
  publicKey: '본인의_Public_Key'
});
```

위 한글 예시를 그대로 사용하지 말고 실제 대시보드에서 복사한 값을 넣습니다.
이 세 값은 공개 브라우저 연동 식별자입니다. Private Key, SMTP 비밀번호, Gmail 비밀번호 또는 OAuth 토큰을 절대 넣지 마세요.
수신자 주소는 이 파일이 아니라 EmailJS 템플릿에 고정합니다.

저장 후 VS Code Live Server로 `index.html`을 열거나 HTTPS 배포 주소로 접속합니다.
파일 더블클릭(`file://`)에서는 발송하지 않습니다.

## 4. 실제 수신 테스트

1. 먼저 공식 홈페이지에서 고객 문의의 '예시 입력' 버튼을 누르고, 문의 접수 시연을 실행합니다.
2. 발송 상태가 '이메일 알림 요청 성공'인지 확인합니다.
3. 운영자 이메일 받은편지함 및 스팸함과 EmailJS History를 확인합니다.
4. 카페 메뉴 가상 주문, 굿즈 가상 구매, 가상 예약 신청도 각각 한 번씩 테스트합니다. 모두 테스트 데이터만 사용합니다.
5. 관리자 대시보드의 EmailJS 운영 알림 표에서 접수 번호와 상태를 비교합니다.
6. `enabled: false`로 변경하고 새로고침한 뒤, 새 가상 기록에서 이메일이 발송되지 않는지 확인합니다.

## 5. 동작과 제한

| 유형 | 발송 정보 |
|---|---|
| 카페 주문 | 접수번호, 메뉴, 수량, 옵션, 품목 합계, 할인, 배달비, 원화 총액 |
| 굿즈 주문 | 접수번호, 상품, 수량, 품목 합계, 원화 총액 |
| 예약 신청 | 접수번호, 날짜, 시간, 인원, 좌석 |
| 고객 문의 | 접수번호, 문의 유형 및 사용자가 제출한 문의 내용 |

- 주문자 입력 이름, 전화번호, 주소, 결제 수단 정보는 발송하지 않습니다. 문의란에도 개인 정보를 적지 마세요.
- 이메일 발송 오류는 기존 가상 주문 결과와 분리됩니다. 자동 재발송하지 않으며, 네트워크 오류는 발송 결과 미확인으로 표시합니다. EmailJS History에서 확인하세요.
- 한 브라우저의 최근 100건의 상태만 보존합니다. 같은 탭에서 요청 간격을 1.2초 이상 유지하고, 최근 이벤트의 중복 호출을 차단합니다. 브라우저 간 동시성·영구 중복 방지는 서버가 필요합니다.
- EmailJS의 성공 응답은 발송 요청이 받아들여졌다는 의미입니다. 수신함에 도착했는지는 이메일과 대시보드에서 직접 확인해야 합니다.
- 관리자 기능 자체에는 실제 인증 서버가 없습니다. 공개 서비스 운영 목적으로 쓰려면 별도의 인증, 서버, 권한 검증 및 개인정보 처리 정책이 필요합니다.

## 공식 참고 문서

- [EmailJS REST /send](https://www.emailjs.com/docs/rest-api/send/)
- [템플릿 생성](https://www.emailjs.com/docs/user-guide/creating-email-templates/)
- [템플릿 변수](https://www.emailjs.com/docs/user-guide/dynamic-variables-templates/)
- [공개 키 안내](https://www.emailjs.com/docs/faq/is-it-okay-to-expose-my-public-key/)
- [남용 방지](https://www.emailjs.com/docs/faq/does-emailjs-expose-my-account-to-spam/)
