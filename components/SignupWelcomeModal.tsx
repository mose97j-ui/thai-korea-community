"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  clearSignupWelcomePending,
  isSignupWelcomePending,
} from "@/lib/auth/signupWelcome";

const THAI_WELCOME_MESSAGE = `สวัสดีครับ

ผมได้สร้างชุมชนออนไลน์แห่งนี้ขึ้นมา เพื่อเป็นอีกหนึ่งพื้นที่ที่อาจช่วยเหลือคนไทยที่กำลังใช้ชีวิต ทำงาน และเรียนอยู่ในประเทศเกาหลีใต้ได้ไม่มากก็น้อย

ผมหวังว่าทุกคนจะเข้ามาใช้งานเว็บไซต์แห่งนี้ แบ่งปันข้อมูล ข่าวสาร ประสบการณ์ และช่วยกันพัฒนาให้ชุมชนนี้เติบโตและมีประโยชน์มากยิ่งขึ้น

ผมหวังว่าชุมชนแห่งนี้จะช่วยให้การใช้ชีวิตของทุกคนในเกาหลีสะดวกขึ้น อุ่นใจขึ้น และดีขึ้นกว่าเดิม

เว็บไซต์นี้ถูกสร้างขึ้นด้วยความรัก ความผูกพัน และความคิดถึงที่ผมมีต่อประเทศไทยและคนไทยเสมอมา

ขอบคุณทุกท่านที่เข้ามาเป็นส่วนหนึ่งของชุมชนแห่งนี้ครับ 🙏🇹🇭🇰🇷`;

export default function SignupWelcomeModal() {
  const { user, isReady } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isReady || !user?.id) {
      setOpen(false);
      return;
    }
    setOpen(isSignupWelcomePending(user.id));
  }, [isReady, user?.id]);

  if (!open || !user?.id) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4">
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-black/[0.08] sm:p-6">
        <p className="mb-3 text-sm font-semibold text-[#06C755]">Thai Korea Community</p>
        <div className="max-h-[65vh] overflow-y-auto pr-1">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 sm:text-base">
            {THAI_WELCOME_MESSAGE}
          </p>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={() => {
              clearSignupWelcomePending(user.id);
              setOpen(false);
            }}
            className="inline-flex items-center justify-center rounded-full bg-[#06C755] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-95 active:bg-[#05b34c]"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
