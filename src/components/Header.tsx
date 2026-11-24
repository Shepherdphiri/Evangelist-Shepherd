import { PageRoute } from '../types/ministry';

interface HeaderProps {
  brandName: string;
  currentPage: PageRoute;
  onNavigate: (page: PageRoute) => void;
}

const NAV_ITEMS: { id: PageRoute; label: string }[] = [
  { id: 'home', label: 'HOME' },
  { id: 'about', label: 'ABOUT' },
  { id: 'sermons', label: 'SERMONS' },
  { id: 'blog', label: 'BLOG' },
];

export function Header({ brandName, currentPage, onNavigate }: HeaderProps) {
  const renderNavLinks = (compact?: boolean) =>
    NAV_ITEMS.map((item, idx) => {
      const active = currentPage === item.id;
      return (
        <div key={item.id} className="flex items-center gap-1.5 sm:gap-2">
          {idx > 0 && (
            <span aria-hidden="true" className="text-[#D4D4D8] font-normal px-0.5 sm:px-1">
              |
            </span>
          )}
          <button
            type="button"
            onClick={() => onNavigate(item.id)}
            aria-current={active ? 'page' : undefined}
            className={`px-1.5 sm:px-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2563EB] ${
              compact ? 'py-1' : 'py-1.5'
            } ${
              active
                ? 'text-[#0B0B0D] border-[#2563EB]'
                : 'text-[#52525B] border-transparent hover:text-[#0B0B0D]'
            }`}
          >
            {item.label}
          </button>
        </div>
      );
    });

  return (
    <header className="sticky top-0 z-40 bg-[#FAFAFA]/95 backdrop-blur-md border-b border-[#E4E4E7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 md:h-16 flex items-center justify-between gap-3 md:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="text-sm sm:text-lg font-semibold tracking-tight text-[#0B0B0D] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2563EB]"
        >
          {brandName}
        </button>

        {/* Zone 2 (Desktop): HOME | ABOUT | SERMONS | BLOG */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-2 text-xs font-semibold tracking-widest text-[#52525B]"
        >
          {renderNavLinks()}
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('contact')}
            className={`inline-flex items-center justify-center px-3.5 py-2 sm:px-5 sm:py-2.5 text-[11px] sm:text-xs font-semibold tracking-wider uppercase rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] ${
              currentPage === 'contact'
                ? 'bg-[#2563EB] text-white'
                : 'bg-[#0B0B0D] text-white hover:bg-[#2563EB]'
            }`}
          >
            Get In Touch
          </button>
        </div>
      </div>

      {/* Zone 2 (Mobile): Visible Centered HOME | ABOUT | SERMONS | BLOG */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden border-t border-[#E4E4E7]/80 bg-[#FAFAFA]"
      >
        <div className="max-w-7xl mx-auto px-3 py-2 flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-semibold tracking-widest text-[#52525B]">
          {renderNavLinks(true)}
        </div>
      </nav>
    </header>
  );
}
