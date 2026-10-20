export function LandingFooter() {
  return (
    <footer className="py-14 border-t border-white/[0.08] bg-[#07080A] select-none text-xs text-aura-text-dim">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#141519] border border-white/[0.1] flex items-center justify-center">
            <span className="text-[10px] font-extrabold text-aura-beige font-display">A</span>
          </div>
          <div>
            <span className="font-bold text-aura-cream font-display tracking-widest uppercase">
              PROJECT AURA
            </span>
            <p className="text-[10px] text-aura-text-dim mt-0.5">
              Adaptive Universal Responsive Assistant
            </p>
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center gap-6 text-aura-text-muted">
          <a href="#features" className="hover:text-aura-cream transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-aura-cream transition-colors">Architecture</a>
          <a href="#automation" className="hover:text-aura-cream transition-colors">Windows Automation</a>
          <a href="#security" className="hover:text-aura-cream transition-colors">Security & Privacy</a>
          <a href="#" className="hover:text-aura-cream transition-colors">Terms of Service</a>
        </div>

        {/* Copyright */}
        <div className="font-mono text-[11px] text-aura-text-dim">
          © {new Date().getFullYear()} PROJECT AURA. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
