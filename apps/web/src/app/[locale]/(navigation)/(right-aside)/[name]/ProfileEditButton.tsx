'use client'

import { getSafeProfileImageURL } from '@sobok/std'
import { Dialog, DialogBody, DialogFooter, DialogHeader } from '@sobok/ui'
import { SquarePen } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type SubmitEvent, type SyntheticEvent, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

import { useRouter } from '@/i18n/navigation'

import {
  buildProfileEditPatch,
  clearProfileInputValidity,
  clearProfileValidity,
  type EditableProfile,
  type ProfileFieldErrors,
} from './profile-edit-form'
import usePatchMyProfileMutation from './usePatchMyProfileMutation'

const formId = {
  username: 'username',
  name: 'name',
  image: 'image',
}

type Props = {
  me: EditableProfile
}

export default function ProfileEditButton({ me }: Props) {
  const [currentMe, setCurrentMe] = useState(me)
  const [showModal, setShowModal] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({})
  const defaultProfileImageURL = getSafeProfileImageURL(currentMe.image ?? '')
  const [profileImageURL, setProfileImageURL] = useState(defaultProfileImageURL)
  const formRef = useRef<HTMLFormElement | null>(null)
  const t = useTranslations('Profile.edit')
  const tErrors = useTranslations('Errors')
  const router = useRouter()

  const editMutation = usePatchMyProfileMutation({
    onError: (error) => {
      clearProfileValidity(formRef.current)
      toast.warning(error.message || tErrors('fallback'))
    },

    onSuccess: async (data) => {
      setCurrentMe((previous) => ({
        ...previous,
        ...(data.name !== undefined && { name: data.name }),
        ...(data.username !== undefined && { username: data.username.toLowerCase() }),
        ...(data.image !== undefined && { image: data.image }),
      }))

      setFieldErrors({})
      setShowModal(false)
      toast.success(t('success'))

      if (data.username && data.username.toLowerCase() !== currentMe.username) {
        router.replace(`/@${data.username.toLowerCase()}`)
      }
    },
  })

  const isPending = editMutation.isPending

  function handleClose() {
    setShowModal(false)
  }

  function handleFormInput(e: SyntheticEvent<HTMLFormElement>) {
    clearProfileInputValidity(e.target)

    const target = e.target

    if (!(target instanceof HTMLInputElement)) {
      return
    }

    setFieldErrors((previous) => {
      if (!(target.name in previous)) {
        return previous
      }

      return {
        ...previous,
        [target.name]: undefined,
      }
    })
  }

  function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()

    clearProfileValidity(formRef.current)
    setFieldErrors({})

    if (!e.currentTarget.reportValidity()) {
      return
    }

    const formData = new FormData(e.currentTarget)
    const patch = buildProfileEditPatch(currentMe, formData)

    if (!patch) {
      toast.warning(t('emptyPatch'))
      return
    }

    editMutation.mutate(patch)
  }

  function handleReset() {
    setFieldErrors({})
    setProfileImageURL(defaultProfileImageURL)
    clearProfileValidity(formRef.current)
  }

  // NOTE: me가 변경될 때마다 currentMe를 갱신해요
  useEffect(() => {
    setCurrentMe(me)
  }, [me])

  // NOTE: 모달이 닫힐 때마다 폼을 초기화해요
  useEffect(() => {
    if (!showModal) {
      formRef.current?.reset()
      setProfileImageURL(defaultProfileImageURL)
      setFieldErrors({})
      clearProfileValidity(formRef.current)
    }
  }, [defaultProfileImageURL, showModal])

  return (
    <>
      <button
        className={twMerge(
          'flex items-center gap-3 text-sm font-semibold rounded-full p-2 transition whitespace-nowrap md:px-3 md:py-2',
          'hover:bg-surface-2 active:bg-surface disabled:text-foreground-subtle disabled:bg-surface-2 aria-hidden:hidden',
        )}
        onClick={() => setShowModal(true)}
        type="button"
      >
        <SquarePen className="size-5 shrink-0" />
        <span className="min-w-0 hidden md:block">{t('action')}</span>
      </button>
      <Dialog ariaLabel={t('action')} className="sm:max-w-2xl" onClose={handleClose} open={showModal}>
        <form
          className="flex flex-1 flex-col min-h-0"
          onInput={handleFormInput}
          onReset={handleReset}
          onSubmit={handleSubmit}
          ref={formRef}
        >
          <DialogHeader onClose={handleClose} title={t('action')} />
          <DialogBody className="p-0 sm:p-0">
            <div className="relative">
              <div className="h-32 bg-linear-to-b from-surface-2 to-surface" />
              <div className="absolute bottom-0 left-4 transform translate-y-1/2">
                <div className="w-24 h-24 rounded-full border-4 border-background overflow-hidden bg-surface-2">
                  <img alt={t('imageAlt')} className="w-full h-full object-cover" src={profileImageURL || undefined} />
                </div>
              </div>
            </div>
            <div className="grid gap-4 p-4 pt-16">
              <div className="grid gap-1">
                <label className="block text-sm font-medium text-foreground-muted" htmlFor="email">
                  {t('email')}
                </label>
                <input
                  className="w-full px-3 py-2 bg-surface border border-border-2 rounded-lg text-foreground-subtle cursor-not-allowed"
                  defaultValue={me.email}
                  disabled
                  id="email"
                  type="text"
                />
                <p className="text-xs text-foreground-faint">{t('immutable')}</p>
              </div>
              <div className="grid gap-1">
                <label className="block text-sm font-medium text-foreground-secondary" htmlFor={formId.username}>
                  {t('name')}
                </label>
                <input
                  aria-invalid={Boolean(fieldErrors.username)}
                  autoCapitalize="off"
                  autoComplete="username"
                  className={twMerge(
                    'w-full px-3 py-2 bg-surface-2 border rounded-lg placeholder-foreground-subtle focus:outline-none focus:ring-2 focus:border-transparent',
                    'aria-invalid:border-red-500 aria-invalid:focus:ring-red-500 border-border-2 focus:ring-border-strong',
                  )}
                  defaultValue={currentMe.username ?? ''}
                  id={formId.username}
                  maxLength={32}
                  minLength={2}
                  name={formId.username}
                  placeholder={t('namePlaceholder')}
                  type="text"
                />
                <p
                  aria-invalid={Boolean(fieldErrors.username)}
                  className="text-xs text-foreground-subtle aria-invalid:text-red-400"
                >
                  {fieldErrors.username || t('nameHelp')}
                </p>
              </div>
              <div className="grid gap-1">
                <label className="block text-sm font-medium text-foreground-secondary" htmlFor={formId.name}>
                  {t('nickname')}
                </label>
                <input
                  aria-invalid={Boolean(fieldErrors.name)}
                  autoCapitalize="off"
                  className={twMerge(
                    'w-full px-3 py-2 bg-surface-2 border border-border-2 rounded-lg placeholder-foreground-subtle focus:outline-none focus:ring-2 focus:ring-border-strong focus:border-transparent',
                    'aria-invalid:border-red-500 aria-invalid:focus:ring-red-500',
                  )}
                  defaultValue={currentMe.name}
                  id={formId.name}
                  maxLength={32}
                  minLength={2}
                  name={formId.name}
                  placeholder={t('nicknamePlaceholder')}
                  type="text"
                />
                <p
                  aria-invalid={Boolean(fieldErrors.name)}
                  className="text-xs text-foreground-subtle aria-invalid:text-red-400"
                >
                  {fieldErrors.name || t('nicknameHelp')}
                </p>
              </div>
              <div className="grid gap-1">
                <label className="block text-sm font-medium text-foreground-secondary" htmlFor={formId.image}>
                  {t('imageURL')}
                </label>
                <input
                  aria-invalid={Boolean(fieldErrors.image)}
                  autoCapitalize="off"
                  autoComplete="photo"
                  className={twMerge(
                    'w-full px-3 py-2 bg-surface-2 border border-border-2 rounded-lg placeholder-foreground-subtle focus:outline-none focus:ring-2 focus:ring-border-strong focus:border-transparent',
                    'aria-invalid:border-red-500 aria-invalid:focus:ring-red-500',
                  )}
                  defaultValue={defaultProfileImageURL}
                  id={formId.image}
                  maxLength={256}
                  minLength={8}
                  name={formId.image}
                  onChange={(e) => setProfileImageURL(getSafeProfileImageURL(e.currentTarget.value))}
                  pattern="https?://.+"
                  placeholder="https://example.com/profile.jpg"
                  type="url"
                />
                <p
                  aria-invalid={Boolean(fieldErrors.image)}
                  className="text-xs text-foreground-subtle aria-invalid:text-red-400"
                >
                  {fieldErrors.image || t('imageURLHelp')}
                </p>
              </div>
              <p className="p-3 bg-surface-2/50 rounded-lg text-xs text-foreground-muted leading-relaxed">
                {t('propagationNotice')}
              </p>
            </div>
          </DialogBody>
          <DialogFooter className="bg-surface/50">
            <div className="flex items-center justify-between">
              <button
                className="px-4 py-2 text-sm font-medium text-foreground-muted hover:text-foreground-secondary"
                type="reset"
              >
                {t('reset')}
              </button>
              <button
                className="px-6 py-2 bg-white text-black font-medium text-sm rounded-lg hover:bg-surface-2 active:bg-surface-3 disabled:opacity-50"
                disabled={isPending}
                type="submit"
              >
                {t('save')}
              </button>
            </div>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  )
}
