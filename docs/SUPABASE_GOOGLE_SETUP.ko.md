# Supabase Google 로그인 설정 가이드

프로젝트: `vniflkqbmybgfnoekxny`  
Supabase URL: `https://vniflkqbmybgfnoekxny.supabase.co`

코드는 이미 준비되어 있습니다. 아래 3단계만 Supabase / Google Cloud에서 완료하면 됩니다.

---

## 1단계 — profiles 테이블 생성 (SQL)

1. [Supabase SQL Editor 열기](https://supabase.com/dashboard/project/vniflkqbmybgfnoekxny/sql/new)
2. `supabase/migrations/001_profiles.sql` 파일 내용 전체 복사
3. **Run** 클릭

---

## 2단계 — Google Cloud OAuth 클라이언트 만들기

1. [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials) 이동
2. **Create Credentials → OAuth client ID**
3. Application type: **Web application**
4. 아래 값 입력:

| 항목 | 값 |
|------|-----|
| Authorized JavaScript origins | `http://localhost:3000` |
| Authorized redirect URIs | `https://vniflkqbmybgfnoekxny.supabase.co/auth/v1/callback` |

5. **Create** 후 **Client ID**와 **Client Secret** 복사

> 배포 시 origins에 `https://thai-korea-community.vercel.app` 도 추가하세요.  
> **다른 사람도 가입**하려면 OAuth consent screen을 **Publish** 해야 합니다 → [GOOGLE_PUBLIC_SIGNUP.ko.md](./GOOGLE_PUBLIC_SIGNUP.ko.md)

---

## 3단계 — Supabase에 Google Provider 연결

### 3-A. Google Provider

**방법 A — 자동 (권장)**

1. [Supabase Access Token 발급](https://supabase.com/dashboard/account/tokens)
2. `.env.local`에 `SUPABASE_ACCESS_TOKEN=...` 추가 (Google ID/Secret은 이미 저장됨)
3. 터미널: `npm run setup:google`

**방법 B — 수동**

1. [Supabase → Auth → Google Provider](https://supabase.com/dashboard/project/vniflkqbmybgfnoekxny/auth/providers?provider=Google) 열기
2. **Enable Sign in with Google** 켜기
3. `.env.local`의 `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` 값 붙여넣기
4. **Save**

### 3-B. Redirect URL 설정

1. [Supabase → Auth → URL Configuration](https://supabase.com/dashboard/project/vniflkqbmybgfnoekxny/auth/url-configuration) 열기
2. 아래 값 설정:

| 항목 | 값 |
|------|-----|
| Site URL | `http://localhost:3000` |
| Redirect URLs | `http://localhost:3000/auth/callback` |

3. **Save**

> 배포 시 Site URL과 Redirect URLs에 실제 도메인도 추가하세요.

---

## 확인

터미널에서:

```bash
npm run verify:supabase
```

모두 ✅ 이면:

```bash
npm run dev
```

브라우저에서 `/signup` → **Google로 가입** 클릭 → Google 계정 선택 → `/signup/complete`에서 프로필 입력 → 완료.

---

## 흐름 요약

```
/signup → Google OAuth → /auth/callback → /auth/continue
  → (프로필 미완) /signup/complete → 홈
  → (이미 가입) 홈
```

---

## 문제 해결

| 증상 | 해결 |
|------|------|
| Google 버튼 클릭 후 오류 | 2~3단계 Client ID/Secret, Redirect URI 재확인 |
| 로그인 후 바로 /login 으로 돌아옴 | URL Configuration에 `/auth/callback` 등록 |
| 프로필 저장 실패 | 1단계 SQL 실행 여부 확인 (`npm run verify:supabase`) |
| `redirect_uri_mismatch` | Google Console redirect URI가 Supabase callback URL과 정확히 일치하는지 확인 |
