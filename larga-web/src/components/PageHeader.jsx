export function PageHeader({ title, description, action }) {
  return <header className="mb-7 flex flex-wrap items-start justify-between gap-4 border-b border-orange-100 pb-6">
    <div className="border-l-4 border-primary pl-4"><h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
      {description && <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>}
    </div>{action}
  </header>;
}

export function Page({ children }) {
  return <div className="h-full overflow-y-auto"><div className="mx-auto w-full max-w-5xl px-5 py-7 sm:px-8 lg:px-12 lg:py-10">{children}</div></div>;
}
