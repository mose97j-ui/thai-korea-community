# Vercel 배포 가이드

Next.js 앱을 **Vercel**에 배포하는 절차입니다.

## 사전 확인

로컬에서 빌드가 통과해야 합니다.

```bash
npm run build
```

## 1. GitHub에 코드 올리기

원격 저장소가 없다면 GitHub에서 새 repo를 만든 뒤:

```bash
git add .
git commit -m "Prepare community app for production deploy"
git remote add origin https://github.com/YOUR_USER/thai-korea-community.git
git push -u origin main
```

## 2. Vercel 프로젝트 연결

1. [vercel.com](https://vercel.com) 로그인
2. **Add New → Project**
3. GitHub repo `thai-korea-community` 선택 → **Import**
4. Framework: **Next.js** (자동 감지)
5. **Environment Variables**에 아래 추가 (Production / Preview / Development 모두)

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase Publishable key |
| `NEXT_PUBLIC_KAKAO_MAP_KEY` | Kakao JavaScript 키 |
| `KAKAO_REST_API_KEY` | Kakao REST API 키 |
| `PREMIUM_PAYMENT_MOCK` | `true` (결제 테스트) |

6. **Deploy** 클릭

배포 URL 예: `https://thai-korea-community.vercel.app`

## 3. Supabase URL 설정 (배포 후 필수)

배포가 끝나면 **실제 Vercel URL**을 Supabase에 등록합니다.

[Supabase → Auth → URL Configuration](https://supabase.com/dashboard/project/vniflkqbmybgfnoekxny/auth/url-configuration)

| 항목 | 값 |
|------|-----|
| Site URL | `https://YOUR-APP.vercel.app` |
| Redirect URLs | `https://YOUR-APP.vercel.app/auth/callback` |

로컬 개발용 URL도 함께 유지:

- `http://localhost:3000`
- `http://localhost:3000/auth/callback`

## 5. Google OAuth — 다른 사람도 가입 가능하게

[GOOGLE_PUBLIC_SIGNUP.ko.md](./GOOGLE_PUBLIC_SIGNUP.ko.md) 가이드를 따라:

1. Google OAuth consent screen **Publish App**
2. Supabase Redirect URLs에 Vercel URL 추가
3. Google Cloud origins에 Vercel URL 추가

## 6. Kakao Developers (배포 도메인 추가)

[Kakao Developers](https://developers.kakao.com/) → 앱 → **플랫폼 → Web**

- `https://YOUR-APP.vercel.app` 등록

## 7. 배포 확인

1. Vercel URL 접속 → 홈 로딩
2. Google 로그인 → `/auth/callback` → 홈 이동
3. 장소리뷰 → 주소 검색·지도 표시
4. `npm run verify:supabase` (로컬 `.env.local` 기준)

## CLI로 배포 (선택)

```bash
npx vercel login
npx vercel link
npx vercel env pull .env.local   # 선택: Vercel env를 로컬로
npx vercel --prod
```

## 커스텀 도메인

Vercel 프로젝트 → **Settings → Domains**에서 도메인 연결 후,  
위 Supabase / Google / Kakao 설정에도 **동일 도메인**을 추가하세요.

## 관련 문서

- [Supabase Google 설정](./SUPABASE_GOOGLE_SETUP.ko.md)
- [Kakao Maps 설정](./KAKAO_MAP_SETUP.ko.md)
