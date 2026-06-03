import AuthPageShell from "@/components/AuthPageShell";
import { Card } from "@/components/ui";

export default function TermsPage() {
  return (
    <AuthPageShell centerContent>
      <Card className="space-y-4 text-sm leading-relaxed text-gray-700">
        <h1 className="text-2xl font-bold text-gray-900">Terms of Service / ข้อกำหนดการใช้งาน</h1>
        <p>
          This community is for Thai people living in Korea. Be respectful, do not post illegal
          content, and follow moderator decisions.
        </p>
        <p>ชุมชนสำหรับคนไทยในเกาหลี — ห้ามโพสต์เนื้อหาผิดกฎหมาย และเคารพผู้ดูแล</p>
        <p>한국 거주 태국인 전용 커뮤니티입니다. 불법·혐오 콘텐츠를 금지합니다.</p>
      </Card>
    </AuthPageShell>
  );
}
