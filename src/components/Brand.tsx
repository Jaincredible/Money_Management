// Shared PocketGlow brand elements.
// Full logo image (public/pocketglow-logo.jpg) for big brand moments;
// a crisp two-tone wordmark (white "Pocket" + green "Glow") for compact UI.

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-extrabold tracking-tight ${className}`}>
      <span className="text-white">Pocket</span>
      <span className="bg-gradient-to-r from-lime-300 to-green-500 bg-clip-text text-transparent">Glow</span>
    </span>
  );
}

export function BrandLogo({ className = '' }: { className?: string }) {
  return <img src="/pocketglow-logo.jpg" alt="PocketGlow — Smart Spending. Better Tomorrow." className={className} draggable={false} />;
}
