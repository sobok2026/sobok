import { twMerge } from 'tailwind-merge'

export const authInputClassName = twMerge(
  'w-full rounded-xl bg-white/4 border border-white/7 pl-3 pr-10 py-2.5 text-foreground placeholder:text-foreground-subtle transition',
  'focus:outline-none focus:ring-2 focus:ring-white/12 focus:border-transparent',
  'disabled:opacity-60 disabled:cursor-not-allowed',
  'user-invalid:border-red-600/50 user-invalid:focus:ring-red-600/30',
)

export const authTrailingButtonClassName = twMerge(
  'absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1.5 bg-white/5 border border-white/7 text-foreground-muted hover:text-foreground hover:bg-white/7 transition',
  'opacity-0 pointer-events-none',
  'group-has-[input:focus:not(:placeholder-shown)]:opacity-100 group-has-[input:focus:not(:placeholder-shown)]:pointer-events-auto',
  'disabled:opacity-50',
)
