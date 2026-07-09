'use client'

import { Dialog, DialogBody, DialogFooter, DialogHeader } from '@sobok/ui'
import { Pen } from 'lucide-react'
import { useState } from 'react'
import { twMerge } from 'tailwind-merge'

type Props = {
  className?: string
}

export default function PublishButton({ className = '' }: Props) {
  const [isOpened, setIsOpened] = useState(false)

  return (
    <>
      <div
        className={twMerge(
          'text-center text-lg leading-5',
          '[&_button]:bg-surface-3 [&_button]:hover:bg-surface-4 [&_button]:active:bg-surface-3',
          '[&_button]:rounded-full [&_button]:disabled:opacity-50 [&_button]:transition [&_button]:border-2 [&_button]:border-border-strong',
          className,
        )}
      >
        <button className="p-3 2xl:hidden" onClick={() => setIsOpened(true)} type="button">
          <Pen aria-label="글쓰기" className="size-6 shrink-0 text-foreground" />
        </button>
        <button className="w-11/12 p-4 hidden 2xl:block" onClick={() => setIsOpened(true)} type="button">
          게시하기
        </button>
      </div>
      <Dialog ariaLabel="게시하기" className="sm:max-w-lg" onClose={() => setIsOpened(false)} open={isOpened}>
        <DialogHeader onClose={() => setIsOpened(false)} title="게시하기" />

        <DialogBody>
          <p className="text-foreground-muted">무슨 일이 일어나고 있나요? (준비 중)</p>
        </DialogBody>

        <DialogFooter>
          <button
            type="button"
            className="w-full rounded-lg bg-surface-2 p-3 font-semibold text-foreground-subtle"
            disabled
          >
            게시하기
          </button>
        </DialogFooter>
      </Dialog>
    </>
  )
}
