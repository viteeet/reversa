'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items?: BreadcrumbItem[];
};

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  const pathname = usePathname();
  
  // Se não fornecer items, gera automaticamente baseado no pathname
  const breadcrumbItems: BreadcrumbItem[] = items || (() => {
    const paths = pathname.split('/').filter(Boolean);
    const generated: BreadcrumbItem[] = [{ label: 'Dashboard', href: '/dashboard' }];
    
    let currentPath = '';
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
      generated.push({
        label,
        href: index === paths.length - 1 ? undefined : currentPath
      });
    });
    
    return generated;
  })();

  return (
    <nav className="flex items-center gap-2 text-sm text-[#64748b] mb-4">
      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && (
            <span className="text-[#cbd5e1]">/</span>
          )}
          {item.href ? (
            <Link 
              href={item.href}
              className="hover:text-[#0369a1] transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-[#1e293b] font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}

