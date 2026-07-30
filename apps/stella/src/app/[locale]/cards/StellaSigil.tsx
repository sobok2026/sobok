import { twMerge } from 'tailwind-merge'

/**
 * Four-pointed star drawn from its outline. The `✦` dingbat (U+2726) is absent from Pretendard, so
 * as text it resolves to whatever fallback face the platform offers — and the fallback differs per
 * locale because ko/ja/zh lead with different families. At display sizes that shape change is
 * obvious, so the card marks use this vector instead.
 */
export default function StellaSigil({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={twMerge('inline-block', className)}
      fill="currentColor"
      height="1em"
      viewBox="0 0 24 24"
      width="1em"
    >
      <path d="M12 1C12.6 6.9 17.1 11.4 23 12C17.1 12.6 12.6 17.1 12 23C11.4 17.1 6.9 12.6 1 12C6.9 11.4 11.4 6.9 12 1Z" />
    </svg>
  )
}
