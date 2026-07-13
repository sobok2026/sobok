import { Fingerprint, Key, Smartphone, SquareAsterisk, Usb } from 'lucide-react'

// better-auth 패스키의 deviceType은 WebAuthn credentialDeviceType이다.
// multiDevice = 클라우드에 동기화되는 패스키(iCloud 키체인, Google 비밀번호 관리자 등),
// singleDevice = 기기에 종속된 자격 증명(하드웨어 보안 키 등).
export function getDeviceInfo(deviceType: string) {
  switch (deviceType) {
    case 'singleDevice':
      return {
        icon: <Usb className="size-6 text-brand" />,
        label: '보안 키',
        bgColor: 'bg-brand/10',
      }
    case 'multiDevice':
      return {
        icon: <Smartphone className="size-6 text-brand" />,
        label: '동기화 패스키',
        bgColor: 'bg-brand/10',
      }
    default:
      return {
        icon: <Key className="size-6 text-foreground-muted" />,
        label: '패스키',
        bgColor: 'bg-surface-2',
      }
  }
}

export function getPasskeyDisplayName(name: string | null) {
  return name?.trim() || '패스키'
}

export function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return '방금 전'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return `${diffInDays}일 전`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths}개월 전`
  }

  const diffInYears = Math.floor(diffInMonths / 12)
  return `${diffInYears}년 전`
}

export function getUserVerificationMethod(deviceType: string) {
  switch (deviceType) {
    case 'singleDevice':
      return {
        icon: <SquareAsterisk className="size-3" />,
        label: 'PIN 또는 터치',
      }
    case 'multiDevice':
      return {
        icon: <Fingerprint className="size-3" />,
        label: '생체 인증 또는 기기 잠금',
      }
    default:
      return null
  }
}
