'use client'

import { useId, useState } from 'react'

import {
  DISCLOSURE_LABELS,
  DISCLOSURES,
  type DisclosureKey,
  type DisclosureState,
  disclosureValue,
  PROFILE_PRESETS,
  type Profile,
  selectedDisclosureCount,
} from '@/lib/experience'

type Props = {
  onStart: (profile: Profile, disclosures: DisclosureState) => void
  onBack: () => void
}

type FieldRowProps = {
  label: string
  value: string
  onChange: (value: string) => void
  inputMode?: 'numeric' | 'text'
  maxLength?: number
  placeholder?: string
}

const PHOTO_OPTIONS = [
  '친구가 찍어 준 여행 사진',
  '동네 카페에서 찍은 셀피',
  '회사 행사에서 찍힌 단체 사진',
  '프로필 촬영 때 남긴 사진',
]

export default function ProfileComposer({ onStart, onBack }: Props) {
  const [presetIndex, setPresetIndex] = useState(0)
  const [profile, setProfile] = useState<Profile>({ ...PROFILE_PRESETS[0].profile })
  const [disclosures, setDisclosures] = useState<DisclosureState>({ ...PROFILE_PRESETS[0].disclosures })
  const selectedCount = selectedDisclosureCount(disclosures)
  const allFieldsFilled = Object.values(profile).every((value) => value.trim().length > 0)
  const ready = allFieldsFilled && selectedCount >= 2

  function updateProfile<Key extends keyof Profile>(key: Key, value: Profile[Key]) {
    setProfile((current) => ({ ...current, [key]: value }))
  }

  function toggleDisclosure(key: DisclosureKey) {
    setDisclosures((current) => ({ ...current, [key]: !current[key] }))
  }

  function loadNextPreset() {
    const nextIndex = (presetIndex + 1) % PROFILE_PRESETS.length
    const next = PROFILE_PRESETS[nextIndex]

    setPresetIndex(nextIndex)
    setProfile({ ...next.profile })
    setDisclosures({ ...next.disclosures })
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!ready) {
      return
    }

    onStart(
      {
        name: profile.name.trim(),
        company: profile.company.trim(),
        role: profile.role.trim(),
        neighborhood: profile.neighborhood.trim(),
        station: profile.station.trim(),
        place: profile.place.trim(),
        friend: profile.friend.trim(),
        family: profile.family.trim(),
        account: profile.account.trim(),
        phoneSuffix: profile.phoneSuffix.trim(),
        profilePhoto: profile.profilePhoto.trim(),
      },
      disclosures,
    )
  }

  return (
    <section className="composer-screen">
      <form autoComplete="off" className="composer-form" onSubmit={handleSubmit}>
        <header className="composer-nav">
          <div className="nav-row">
            <button className="nav-back" onClick={onBack} type="button">
              <span aria-hidden="true">←</span>
              안내
            </button>
            <button className="text-action" onClick={loadNextPreset} type="button">
              다른 사람
            </button>
          </div>
          <div className="nav-title">
            <strong>프로필 만들기</strong>
            <small>오늘 하루를 대신 살 사람</small>
          </div>
        </header>

        <div className="composer-identity">
          <span className="composer-avatar" aria-hidden="true" />
          <strong>{profile.name || '이름 없음'}</strong>
          <small>
            {profile.company} · {profile.role}
          </small>
        </div>

        <div className="settings-group">
          <p className="group-title">기본 정보</p>
          <div className="settings-card">
            <FieldRow label="이름" onChange={(value) => updateProfile('name', value)} value={profile.name} />
            <SelectRow
              label="공개 프로필 사진"
              onChange={(value) => updateProfile('profilePhoto', value)}
              options={PHOTO_OPTIONS}
              value={profile.profilePhoto}
            />
            <FieldRow
              label="공개 계정"
              onChange={(value) => updateProfile('account', value.replace(/^@/, ''))}
              placeholder="아이디"
              value={profile.account}
            />
            <FieldRow
              inputMode="numeric"
              label="연락처 끝 네 자리"
              maxLength={4}
              onChange={(value) => updateProfile('phoneSuffix', value.replace(/\D/g, '').slice(0, 4))}
              value={profile.phoneSuffix}
            />
          </div>
        </div>

        <div className="settings-group">
          <p className="group-title">직장과 생활권</p>
          <div className="settings-card">
            <FieldRow label="회사" onChange={(value) => updateProfile('company', value)} value={profile.company} />
            <FieldRow label="직무" onChange={(value) => updateProfile('role', value)} value={profile.role} />
            <FieldRow
              label="사는 동네"
              onChange={(value) => updateProfile('neighborhood', value)}
              value={profile.neighborhood}
            />
            <FieldRow
              label="이용하는 역"
              onChange={(value) => updateProfile('station', value)}
              value={profile.station}
            />
            <FieldRow
              label="자주 가는 장소"
              onChange={(value) => updateProfile('place', value)}
              value={profile.place}
            />
          </div>
        </div>

        <div className="settings-group">
          <p className="group-title">가까운 사람</p>
          <div className="settings-card">
            <FieldRow
              label="가장 가까운 친구"
              onChange={(value) => updateProfile('friend', value)}
              value={profile.friend}
            />
            <FieldRow
              label="자주 연락하는 가족"
              onChange={(value) => updateProfile('family', value)}
              value={profile.family}
            />
          </div>
        </div>

        <div className="settings-group">
          <p className="group-title">공개 범위</p>
          <p className="group-caption">켜 둔 항목은 누구나 검색해서 찾을 수 있는 정보가 됩니다.</p>
          <div className="settings-card">
            {DISCLOSURES.map((key) => (
              <DisclosureRow
                checked={disclosures[key]}
                key={key}
                label={DISCLOSURE_LABELS[key]}
                onToggle={() => toggleDisclosure(key)}
                value={disclosureValue(key, profile)}
              />
            ))}
          </div>
          <p className="group-caption" data-tone={selectedCount < 2 ? 'warning' : undefined}>
            {selectedCount < 2 ? '두 가지 이상 켜야 시작할 수 있습니다.' : `${selectedCount}개를 공개했습니다.`}
          </p>
        </div>

        <div className="composer-footer">
          <button className="primary-action" disabled={!ready} type="submit">
            이 사람으로 시작하기
          </button>
        </div>
      </form>
    </section>
  )
}

function FieldRow({ label, value, onChange, inputMode = 'text', maxLength, placeholder = '입력' }: FieldRowProps) {
  return (
    <label className="settings-row">
      <span className="row-label">{label}</span>
      <span className="row-control">
        <input
          inputMode={inputMode}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          value={value}
        />
      </span>
    </label>
  )
}

function SelectRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <label className="settings-row">
      <span className="row-label">{label}</span>
      <span className="row-control row-control--select">
        <select onChange={(event) => onChange(event.target.value)} value={value}>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <i aria-hidden="true">⌄</i>
      </span>
    </label>
  )
}

function DisclosureRow({
  label,
  value,
  checked,
  onToggle,
}: {
  label: string
  value: string
  checked: boolean
  onToggle: () => void
}) {
  const id = useId()

  return (
    <div className="settings-row settings-row--switch">
      <span className="row-label">
        <label htmlFor={id}>{label}</label>
        <small>{value}</small>
      </span>
      <button
        aria-checked={checked}
        className="switch"
        data-checked={checked}
        id={id}
        onClick={onToggle}
        role="switch"
        type="button"
      >
        <i aria-hidden="true" />
      </button>
    </div>
  )
}
