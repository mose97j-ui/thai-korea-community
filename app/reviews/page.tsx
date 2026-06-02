"use client";

import PageHeader from "@/components/PageHeader";
import PageShell, { socialDualColumnGridClassName } from "@/components/PageShell";
import { Card, FilterChip, SectionLabel, SubmitButton, inputClassName } from "@/components/ui";
import { useLocale } from "@/contexts/LocaleContext";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import Script from "next/script";

const areas: Record<string, string[]> = {
  서울특별시: [
    "강남구", "강동구", "강북구", "강서구", "관악구",
    "광진구", "구로구", "금천구", "노원구", "도봉구",
    "동대문구", "동작구", "마포구", "서대문구", "서초구",
    "성동구", "성북구", "송파구", "양천구", "영등포구",
    "용산구", "은평구", "종로구", "중구", "중랑구",
  ],

  부산광역시: [
    "강서구", "금정구", "기장군", "남구", "동구", "동래구",
    "부산진구", "북구", "사상구", "사하구", "서구", "수영구",
    "연제구", "영도구", "중구", "해운대구",
  ],

  대구광역시: [
    "군위군", "남구", "달서구", "달성군", "동구",
    "북구", "서구", "수성구", "중구",
  ],

  인천광역시: [
    "강화군", "계양구", "남동구", "동구", "미추홀구",
    "부평구", "서구", "연수구", "옹진군", "중구",
  ],

  광주광역시: ["광산구", "남구", "동구", "북구", "서구"],

  대전광역시: ["대덕구", "동구", "서구", "유성구", "중구"],

  울산광역시: ["남구", "동구", "북구", "울주군", "중구"],

  세종특별자치시: ["세종시"],

  경기도: [
    "수원시", "성남시", "의정부시", "안양시", "부천시",
    "광명시", "평택시", "동두천시", "안산시", "고양시",
    "과천시", "구리시", "남양주시", "오산시", "시흥시",
    "군포시", "의왕시", "하남시", "용인시", "파주시",
    "이천시", "안성시", "김포시", "화성시", "광주시",
    "양주시", "포천시", "여주시", "연천군", "가평군",
    "양평군",
  ],

  강원도: [
    "춘천시", "원주시", "강릉시", "동해시", "태백시",
    "속초시", "삼척시", "홍천군", "횡성군", "영월군",
    "평창군", "정선군", "철원군", "화천군", "양구군",
    "인제군", "고성군", "양양군",
  ],

  충청북도: [
    "청주시", "충주시", "제천시", "보은군", "옥천군",
    "영동군", "증평군", "진천군", "괴산군", "음성군",
    "단양군",
  ],

  충청남도: [
    "천안시", "공주시", "보령시", "아산시", "서산시",
    "논산시", "계룡시", "당진시", "금산군", "부여군",
    "서천군", "청양군", "홍성군", "예산군", "태안군",
  ],

  전라북도: [
    "전주시", "군산시", "익산시", "정읍시", "남원시",
    "김제시", "완주군", "진안군", "무주군", "장수군",
    "임실군", "순창군", "고창군", "부안군",
  ],

  전라남도: [
    "목포시", "여수시", "순천시", "나주시", "광양시",
    "담양군", "곡성군", "구례군", "고흥군", "보성군",
    "화순군", "장흥군", "강진군", "해남군", "영암군",
    "무안군", "함평군", "영광군", "장성군", "완도군",
    "진도군", "신안군",
  ],

  경상북도: [
    "포항시", "경주시", "김천시", "안동시", "구미시",
    "영주시", "영천시", "상주시", "문경시", "경산시",
    "의성군", "청송군", "영양군", "영덕군", "청도군",
    "고령군", "성주군", "칠곡군", "예천군", "봉화군",
    "울진군", "울릉군",
  ],

  경상남도: [
    "창원시", "진주시", "통영시", "사천시", "김해시",
    "밀양시", "거제시", "양산시", "의령군", "함안군",
    "창녕군", "고성군", "남해군", "하동군", "산청군",
    "함양군", "거창군", "합천군",
  ],

  제주특별자치도: ["제주시", "서귀포시"],
};

type Place = {
  id: number;
  name: string;
  category: string;
  address: string;
  city: string;
  gu: string;
  dong: string;
};

const places: Place[] = [];

type Review = {
  id: number;
  name: string;
  category: string;
  address: string;
  content: string;
  lat?: number;
  lng?: number;
};

type MapMarker = {
  setMap?: (map: unknown) => void;
};

type KakaoMapInstance = {
  setCenter: (position: unknown) => void;
  setLevel?: (level: number) => void;
};

const KAKAO_MAP_KEY =
  process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ||
  "YOUR_KAKAO_MAP_KEY";

const cityAliases: Record<string, string> = {
  서울: "서울특별시",
  부산: "부산광역시",
  대구: "대구광역시",
  인천: "인천광역시",
  광주: "광주광역시",
  대전: "대전광역시",
  울산: "울산광역시",
  세종: "세종특별자치시",
  경기: "경기도",
  강원: "강원도",
  충북: "충청북도",
  충남: "충청남도",
  전북: "전라북도",
  전남: "전라남도",
  경북: "경상북도",
  경남: "경상남도",
  제주: "제주특별자치도",
};

function ReviewsContent() {
  const { t, locale } = useLocale();
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedGu, setSelectedGu] = useState("");
  const [selectedDong, setSelectedDong] = useState("");
  const [search, setSearch] = useState("");
  const [reviewName, setReviewName] = useState("");
  const [reviewCategory, setReviewCategory] = useState("음식점");
  const [reviewAddress, setReviewAddress] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [reviewList, setReviewList] = useState<Review[]>([]);
  const [kakaoLoaded, setKakaoLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<KakaoMapInstance | null>(null);
  const markerRefs = useRef<MapMarker[]>([]);

  const extractDong = useCallback((value: string) => {
    const words = value.split(" ");
    const dong = words.find(
      (word) =>
        word.endsWith("동") ||
        word.endsWith("읍") ||
        word.endsWith("면") ||
        word.endsWith("리")
    );

    return dong || "";
  }, []);

  const getCategoryLogo = (cat: string) => {
    if (!cat) return "/logo.png";
    if (cat === "음식점") return "/category_food.svg";
    if (cat === "카페") return "/category_cafe.svg";
    if (cat === "서비스") return "/category_service.svg";
    if (cat === "쇼핑") return "/category_shopping.svg";
    return "/logo.png";
  };

  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value);

      let foundCity = "";
      let foundGu = "";

      Object.keys(areas).forEach((city) => {
        if (value.includes(city)) {
          foundCity = city;
        }
      });

      Object.entries(cityAliases).forEach(([shortName, fullName]) => {
        if (value.includes(shortName)) {
          foundCity = fullName;
        }
      });

      if (foundCity) {
        areas[foundCity].forEach((gu) => {
          if (value.includes(gu)) {
            foundGu = gu;
          }
        });
      }

      setSelectedCity(foundCity);
      setSelectedGu(foundGu);
      setSelectedDong(extractDong(value));
    },
    [extractDong]
  );

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const geocodeAddress = (address: string) => {
    return new Promise<{ lat: number; lng: number } | null>((resolve) => {
      const kakao = (window as any).kakao;
      if (!kakao?.maps?.services) {
        resolve(null);
        return;
      }

      const geocoder = new kakao.maps.services.Geocoder();
      geocoder.addressSearch(address, (result: any, status: any) => {
        if (status !== kakao.maps.services.Status.OK || !result || result.length === 0) {
          resolve(null);
          return;
        }

        resolve({ lat: result[0].y, lng: result[0].x });
      });
    });
  };

  const addReviewMarker = useCallback((review: Review) => {
    if (!mapInstanceRef.current || review.lat == null || review.lng == null) {
      return;
    }

    const kakao = (window as any).kakao;
    if (!kakao) {
      return;
    }

    const position = new kakao.maps.LatLng(review.lat, review.lng);
    const marker = new kakao.maps.Marker({
      position,
      map: mapInstanceRef.current,
    });

    const infoWindow = new kakao.maps.InfoWindow({
      content: `<div style="padding:10px;min-width:200px;"><strong>${review.name}</strong><div>${review.category}</div><div style="margin-top:6px;">${review.address}</div><div style="margin-top:4px;">${review.content}</div></div>`,
    });

    kakao.maps.event.addListener(marker, "click", () => {
      infoWindow.open(mapInstanceRef.current, marker);
    });

    markerRefs.current.push(marker);
  }, []);

  const handleReviewSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = reviewName.trim();
    const trimmedAddress = reviewAddress.trim();
    const trimmedContent = reviewContent.trim();

    if (!trimmedName || !trimmedAddress) {
      alert(t("reviews.alertNameAddress"));
      return;
    }

    const fullAddress = [selectedCity, selectedGu, selectedDong, trimmedAddress]
      .filter(Boolean)
      .join(" ");

    const geo = await geocodeAddress(fullAddress);
    if (!geo) {
      alert(t("reviews.alertGeocodeFail"));
      return;
    }

    const newReview: Review = {
      id: Date.now(),
      name: trimmedName,
      category: reviewCategory,
      address: fullAddress,
      content: trimmedContent,
      lat: geo.lat,
      lng: geo.lng,
    };

    setReviewList((prev) => [...prev, newReview]);
    setReviewName("");
    setReviewAddress("");
    setReviewContent("");

    if (mapInstanceRef.current) {
      const kakao = (window as any).kakao;
      mapInstanceRef.current.setCenter(new kakao.maps.LatLng(geo.lat, geo.lng));
      (mapInstanceRef.current as any).setLevel(4);
    }
  };

  useEffect(() => {
    const q = searchParams?.get("q") || "";
    const cat = searchParams?.get("category") || "";
    if (q) {
      setSearch(q);
      handleSearch(q);
    }
    if (cat) {
      setSelectedCategory(cat);
    }
  }, [searchParams, handleSearch]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    if (!kakaoLoaded) {
      return;
    }

    if (mapInstanceRef.current) {
      markerRefs.current.forEach((marker) => marker.setMap?.(null));
      markerRefs.current = [];
      mapInstanceRef.current = null;
    }

    const kakao = (window as any).kakao;
    mapInstanceRef.current = new kakao.maps.Map(mapRef.current, {
      center: new kakao.maps.LatLng(37.5665, 126.9784),
      level: 6,
    });
  }, [kakaoLoaded]);

  useEffect(() => {
    if (!mapInstanceRef.current) {
      return;
    }

    markerRefs.current.forEach((marker) => marker.setMap?.(null));
    markerRefs.current = [];
    reviewList.forEach(addReviewMarker);
  }, [reviewList, addReviewMarker]);
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const normalizedSearch = search.trim().toLowerCase();

  const matchingPlaces = places.filter((place) => {
    if (!normalizedSearch) {
      return false;
    }

    const placeValues = [
      place.name,
      place.category,
      place.address,
      place.city,
      place.gu,
      place.dong,
    ].join(" ");

    const matchesQuery = placeValues.toLowerCase().includes(normalizedSearch);

    const matchesCategory = selectedCategory ? place.category === selectedCategory : true;

    const matchesCity = selectedCity ? place.city === selectedCity : true;
    const matchesGu = selectedGu ? place.gu === selectedGu : true;
    const matchesDong = selectedDong
      ? place.dong.includes(selectedDong)
      : true;

    return matchesQuery && matchesCity && matchesGu && matchesDong && matchesCategory;
  });

  const groupedPlaces = matchingPlaces.reduce(
    (acc: Record<string, Place[]>, place) => {
      if (!acc[place.category]) {
        acc[place.category] = [];
      }
      acc[place.category].push(place);
      return acc;
    },
    {}
  );

  const gus = selectedCity ? areas[selectedCity] : [];

  const purchaseCategories = new Set([
    "화장품",
    "올리브영",
    "신발",
    "명품",
    "전자제품",
    "간식",
    "건강식품",
  ]);

  const isPurchaseCategory = selectedCategory && purchaseCategories.has(selectedCategory);
  const backHref = isPurchaseCategory ? "/purchase" : "/";
  const backLabel = isPurchaseCategory ? t("reviews.backPurchase") : undefined;
  const pageTitle = selectedCategory
    ? locale === "ko"
      ? `${selectedCategory} 리뷰`
      : `รีวิว ${selectedCategory}`
    : t("reviews.placeTitle");

  return (
    <PageShell maxWidth="full">
        <PageHeader
          compact
          title={pageTitle}
          backHref={backHref}
          backLabel={backLabel}
        />

        <div className="mb-4 flex items-center gap-2 rounded-full bg-white px-4 py-2.5 shadow-sm ring-1 ring-black/[0.06]">
          <span className="text-lg text-gray-400">🔍</span>
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={t("reviews.searchPlaceholder")}
            className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
          />
        </div>

        <div className={socialDualColumnGridClassName}>
          <div className="space-y-4">
        <Card className="mb-0">
          <p className="text-xs font-semibold text-gray-400">{t("reviews.autoClassify")}</p>
          <p className="mt-2 text-sm text-gray-700">
            {selectedCity || t("reviews.noCity")} / {selectedGu || t("reviews.noGu")} / {selectedDong || t("reviews.noDong")}
          </p>
        </Card>

        <Script
          src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_KEY}&libraries=services`}
          strategy="beforeInteractive"
          onLoad={() => setKakaoLoaded(true)}
        />

        <SectionLabel>{t("reviews.map")}</SectionLabel>

        <Card className="mb-0 overflow-hidden p-0">
          <div className="h-72 w-full xl:h-96" ref={mapRef} id="map-container" />
          {!kakaoLoaded && (
            <p className="px-4 py-3 text-sm text-gray-600">
              {t("reviews.kakaoLoading")}
            </p>
          )}
          {KAKAO_MAP_KEY === "YOUR_KAKAO_MAP_KEY" && (
            <p className="px-4 py-3 text-sm text-red-600">
              카카오 지도 앱 키를 환경변수
              <code className="mx-1 rounded bg-gray-100 px-1 text-xs">NEXT_PUBLIC_KAKAO_MAP_KEY</code>
              에 설정해주세요.
            </p>
          )}
        </Card>

        <SectionLabel>{t("reviews.step1City")}</SectionLabel>

        <Card className="mb-0 p-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Object.keys(areas).map((city) => (
              <FilterChip
                key={city}
                active={selectedCity === city}
                onClick={() => {
                  setSelectedCity(city);
                  setSelectedGu("");
                  setSelectedDong("");
                }}
              >
                {city}
              </FilterChip>
            ))}
          </div>
        </Card>

        {selectedCity && (
          <>
            <SectionLabel>{t("reviews.step2Gu")}</SectionLabel>

            <Card className="mb-0 p-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {gus.map((gu) => (
                  <FilterChip
                    key={gu}
                    active={selectedGu === gu}
                    onClick={() => {
                      setSelectedGu(gu);
                      setSelectedDong("");
                    }}
                  >
                    {gu}
                  </FilterChip>
                ))}
              </div>
            </Card>
          </>
        )}

        {selectedGu && (
          <Card className="mb-0">
            <SectionLabel>{t("reviews.step3Dong")}</SectionLabel>

            <input
              value={selectedDong}
              onChange={(e) => setSelectedDong(e.target.value)}
              placeholder={t("reviews.dongPlaceholder")}
              className={inputClassName}
            />
          </Card>
        )}

          </div>

          <div className="space-y-4">
        <Card>
          <SectionLabel>{t("reviews.searchResults")}</SectionLabel>

          {search.trim() ? (
            matchingPlaces.length > 0 ? (
              <div className="space-y-4">
                {Object.entries(groupedPlaces).map(([category, items]) => (
                  <div key={category} className="rounded-xl bg-[#F0F2F5] p-3 ring-1 ring-black/[0.04]">
                    <div className="mb-2 flex items-center gap-3">
                      <Image src={getCategoryLogo(category)} alt={category} width={32} height={32} className="rounded-full object-cover" />
                      <p className="text-sm font-bold text-gray-900">{category}</p>
                    </div>
                    <div className="space-y-2">
                      {items.map((place) => (
                        <div
                          key={place.id}
                          className="rounded-xl bg-white p-3 ring-1 ring-black/[0.04]"
                        >
                          <p className="text-sm font-semibold text-gray-900">{place.name}</p>
                          <p className="text-xs text-gray-500">
                            {place.city} {place.gu} {place.dong} {place.address}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">{t("reviews.noSearchResults")}</p>
            )
          ) : (
            <p className="text-sm text-gray-500">{t("reviews.searchHint")}</p>
          )}
        </Card>

        <Card>
          <SectionLabel>{t("reviews.writeReview")}</SectionLabel>

          <form onSubmit={handleReviewSubmit}>
            <input
              value={reviewName}
              onChange={(e) => setReviewName(e.target.value)}
              placeholder={t("reviews.placeNamePlaceholder")}
              className={`mb-3 ${inputClassName}`}
            />

            <select
              value={reviewCategory}
              onChange={(e) => setReviewCategory(e.target.value)}
              className={`mb-3 ${inputClassName}`}
            >
              <option value="음식점">{t("reviews.catFood")}</option>
              <option value="카페">{t("reviews.catCafe")}</option>
              <option value="서비스">{t("reviews.catService")}</option>
              <option value="쇼핑">{t("reviews.catShopping")}</option>
            </select>

            <input
              value={reviewAddress}
              onChange={(e) => setReviewAddress(e.target.value)}
              placeholder={t("reviews.addressPlaceholder")}
              className={`mb-3 ${inputClassName}`}
            />

            <textarea
              value={reviewContent}
              onChange={(e) => setReviewContent(e.target.value)}
              placeholder={t("reviews.reviewPlaceholder")}
              className={`mb-3 h-28 ${inputClassName}`}
            />

            <input
              type="file"
              accept="image/*"
              className={`mb-3 ${inputClassName}`}
            />

            <SubmitButton>{t("reviews.submitReview")}</SubmitButton>
          </form>

          {reviewList.length > 0 && (
            <div className="mt-6 space-y-3">
              <SectionLabel>{t("reviews.registeredReviews")}</SectionLabel>
              {reviewList.map((review) => (
                <div key={review.id} className="rounded-xl bg-[#F0F2F5] p-4 ring-1 ring-black/[0.04]">
                  <p className="text-sm font-semibold text-gray-900">{review.name}</p>
                  <p className="text-xs text-gray-500">
                    {review.category} · {review.address}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">{review.content}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
          </div>
        </div>
    </PageShell>
  );
}

function ReviewsLoading() {
  const { t } = useLocale();
  return (
    <PageShell>
      <div className="py-12 text-center text-sm text-gray-500">
        {t("common.loading")}
      </div>
    </PageShell>
  );
}

export default function ReviewsPage() {
  return (
    <Suspense fallback={<ReviewsLoading />}>
      <ReviewsContent />
    </Suspense>
  );
}