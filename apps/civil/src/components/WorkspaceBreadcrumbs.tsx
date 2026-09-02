import Link from 'next/link'

export type WorkspaceBreadcrumb = { label: string; href?: string }

export default function WorkspaceBreadcrumbs({ items }: { items: WorkspaceBreadcrumb[] }) {
  return (
    <nav className="workspace-breadcrumbs" aria-label="현재 위치">
      {items.map((item, index) =>
        item.href ? (
          <Link href={item.href} key={`${item.label}-${item.href}`}>
            {item.label}
          </Link>
        ) : (
          <span aria-current="page" key={`${item.label}-${index}`}>
            {item.label}
          </span>
        ),
      )}
    </nav>
  )
}
