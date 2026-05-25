export function SiteFooter({ rightText }: { rightText: string }) {
  return (
    <footer className="pb-12 pt-8 text-sm text-muted">
      <div className="container-shell flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-black/5 bg-white/70 px-5 py-4">
        <div>EchoPaws</div>
        <div>{rightText}</div>
      </div>
    </footer>
  );
}
