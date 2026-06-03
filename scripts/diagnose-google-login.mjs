#!/usr/bin/env node
/**
 * Google 로그인 문제 진단 — 설정 체크리스트 출력
 * 실행: npm run diagnose:google-login
 */
console.log(`
=== Google 로그인 진단 ===

1) Supabase (자동 확인)
   npm run verify:supabase

2) Google Cloud Console — OAuth 클라이언트
   https://console.cloud.google.com/apis/credentials

   Authorized JavaScript origins (필수):
   - https://thai-korea-community.vercel.app
   - http://localhost:3000

   Authorized redirect URIs (필수):
   - https://vniflkqbmybgfnoekxny.supabase.co/auth/v1/callback

3) Google OAuth consent screen — Publish App (다른 사람 가입)
   https://console.cloud.google.com/apis/credentials/consent
   Testing 모드면 Test users에 없는 계정은 로그인 불가

4) Supabase Redirect URLs
   npm run apply:production-auth
   또는 Dashboard → Auth → URL Configuration:
   - Site URL: https://thai-korea-community.vercel.app
   - Redirect: https://thai-korea-community.vercel.app/**
   - Redirect: http://localhost:3000/**

5) Vercel 환경변수 (Production)
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

6) 로그인 실패 시 URL 확인
   /login?error=auth&reason=... 에 표시되는 reason 확인
`);
