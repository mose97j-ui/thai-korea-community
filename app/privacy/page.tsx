import Link from "next/link";
import AuthPageShell from "@/components/AuthPageShell";
import { Card } from "@/components/ui";

export default function PrivacyPage() {
  return (
    <AuthPageShell centerContent>
      <Card className="space-y-4 text-sm leading-relaxed text-gray-700">
        <h1 className="text-2xl font-bold text-gray-900">Privacy Policy / นโยบายความเป็นส่วนตัว</h1>
        <p>
          Thai Korea Community collects Google account email and profile information for
          membership, and optional profile details you enter (nickname, photo, phone).
        </p>
        <p>
          ชุมชนนี้ใช้ Gmail (Google) สำหรับสมัครสมาชิก และเก็บข้อมูลโปรไฟล์ที่คุณกรอกเอง
        </p>
        <p>
          한국 거주 태국인 커뮤니티 서비스 제공을 위해 Google 계정 이메일·프로필 및 회원이
          입력한 정보를 사용합니다.
        </p>
        <p>
          Contact:{" "}
          <Link href="mailto:mose97j@gmail.com" className="text-[#06C755] hover:underline">
            mose97j@gmail.com
          </Link>
        </p>
      </Card>
    </AuthPageShell>
  );
}
