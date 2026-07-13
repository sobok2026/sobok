export default function Layout({ children }: LayoutProps<'/[locale]'>) {
  return <div className="p-safe">{children}</div>
}
