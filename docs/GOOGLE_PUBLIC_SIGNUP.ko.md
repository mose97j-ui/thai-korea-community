# 다른 사람도 Google 회원가입하게 하기

코드는 Google 가입을 지원합니다. **본인만 되고 다른 사람은 안 되는 경우**는 거의 항상 Google OAuth가 **Testing(테스트)** 상태이거나, **배포 URL**이 Supabase / Google Cloud에 등록되지 않았기 때문입니다.

배포 URL: `https://thai-korea-community.vercel.app`

---

## 1. Google OAuth 앱 공개 (가장 중요)

1. [Google Cloud Console → OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent) 이동
2. **User Type: External** 선택
3. 앱 정보 입력
   - App name: `Thai Korea Community`
   - User support email: 본인 Gmail
   - Developer contact: 본인 Gmail
4. Scopes: `email`, `profile`, `openid` (기본값)
5. **Test users**에만 있던 계정 제한을 없애려면:
   - 상단 **Publishing status** → **Publish App** 클릭
   - `email`, `profile`, `openid`만 쓰면 대부분 **바로 Production** 전환 가능 (Google 검수 불필요)

> Testing 상태면 **Test users**에 추가된 Gmail만 로그인할 수 있습니다.

---

## 2. Google Cloud — 배포 도메인 추가

[Credentials → OAuth 2.0 Client IDs](https://console.cloud.google.com/apis/credentials)

| 항목 | 추가할 값 |
|------|-----------|
| Authorized JavaScript origins | `https://thai-korea-community.vercel.app` |
| Authorized JavaScript origins | `http://localhost:3000` (로컬 개발) |
| Authorized redirect URIs | `https://vniflkqbmybgfnoekxny.supabase.co/auth/v1/callback` |

**Save** 후 1~2분 기다린 뒤 테스트하세요.

---

## 3. Supabase — Redirect URL 등록

[Supabase → Auth → URL Configuration](https://supabase.com/dashboard/project/vniflkqbmybgfnoekxny/auth/url-configuration)

| 항목 | 값 |
|------|-----|
| Site URL | `https://thai-korea-community.vercel.app` |
| Redirect URLs | `https://thai-korea-community.vercel.app/auth/callback` |
| Redirect URLs | `http://localhost:3000/auth/callback` |

**Save**

### 자동 설정 (선택)

`.env.local`에 `SUPABASE_ACCESS_TOKEN` 추가 후:

```bash
npm run setup:google
```

로컬 + 배포 Redirect URL을 한 번에 등록합니다.

---

## 4. 확인

```bash
npm run verify:supabase
```

배포 사이트에서:

1. `/signup` 또는 홈 → **Google로 가입**
2. Google 계정 선택
3. `/signup/complete`에서 프로필 입력
4. 홈으로 이동

---

## 문제 해결

| 증상 | 원인 | 해결 |
|------|------|------|
| `Access blocked` / 테스트 사용자만 | OAuth 앱이 Testing | **Publish App** |
| `redirect_uri_mismatch` | Google redirect URI 오타 | Supabase callback URL 정확히 입력 |
| 로그인 후 `/login?error=auth` | Supabase Redirect URLs 미등록 | 3단계 URL 추가 |
| 프로필 저장 실패 | profiles 테이블 없음 | `supabase/migrations/001_profiles.sql` 실행 |

---

## 가입 흐름

```
홈 또는 /signup → Google OAuth
  → /auth/callback → /auth/continue
  → (신규) /signup/complete → 홈
  → (기존 회원) 홈
```
