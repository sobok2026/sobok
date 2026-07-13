'use client'

import { Trash2 } from 'lucide-react'
import { useState } from 'react'

import PasskeyDeleteDialog from './PasskeyDeleteDialog'

type Props = {
  id: string
  className?: string
}

export default function PasskeyDeleteButton({ id, className }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button aria-label="패스키 삭제" className={className} onClick={() => setOpen(true)} type="button">
        <Trash2 className="size-5 shrink-0" />
      </button>
      <PasskeyDeleteDialog id={id} onOpenChange={setOpen} open={open} />
    </>
  )
}
