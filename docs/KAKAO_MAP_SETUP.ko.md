# Kakao Maps API 설정

주소 검색·카테고리 분류·장소리뷰 지도 표시에 Kakao Maps를 사용합니다.

## 1. Kakao Developers

1. [Kakao Developers](https://developers.kakao.com/) → **내 애플리케이션** → 앱 선택 또는 생성
2. **앱 키** 탭에서 아래 키 확인:
   - **JavaScript 키** → 지도 표시 (브라우저)
   - **REST API 키** → 주소 검색·지오코딩 (서버)
3. **플랫폼** 탭 → **Web** 사이트 도메인 등록:
   - `http://localhost:3000`
   - 배포 도메인 (예: `https://your-domain.com`)

## 2. `.env.local` 추가

```env
NEXT_PUBLIC_KAKAO_MAP_KEY=발급받은_JavaScript_키
KAKAO_REST_API_KEY=발급받은_REST_API_키
```

## 3. 동작 요약

| 기능 | 설명 |
|------|------|
| **검색창** | `부산 해운대구 우동` 등 주소 입력 → 추천 주소 + 카테고리별 분류 |
| **검색 결과** | 도로명/지번 주소 + Kakao 지도 + 카테고리별 게시글 |
| **글쓰기** | 주소 자동완성, 도로명(지번) 형식 저장 |
| **장소 게시판** | Kakao 지도에 마커, 클릭 시 해당 글로 이동 |

## 4. 주소 표시 형식

한국에서 흔히 쓰는 형식으로 저장·표시합니다.

```
서울특별시 강남구 테헤란로 123 (지번 서울특별시 강남구 역삼동 123-45)
```

## 5. dev 서버 재시작

`.env.local` 수정 후:

```bash
npm run dev
```
