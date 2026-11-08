import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="page-width header-inner">
        <Link className="brand" href="/"><span>무한 영어 학원</span></Link>
        <nav aria-label="주요 메뉴"><Link href="/">서비스 소개</Link><Link className="header-cta" href="/analyze">데이터 분석</Link></nav>
      </div>
    </header>
  );
}
