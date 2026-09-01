'use client'

import { useState } from 'react'

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
}

type TextFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  inputMode?: 'numeric' | 'text'
  maxLength?: number
}

const PHOTO_OPTIONS = [
  '친구가 찍어 준 여행 사진',
  '동네 카페에서 찍은 셀피',
  '회사 행사에서 찍힌 단체 사진',
  '프로필 촬영 때 남긴 사진',
]

export default function ProfileComposer({ onStart }: Props) {
  const [presetIndex, setPresetIndex] = useState(0)
  const [profile, setProfile] = useState<Profile>({ ...PROFILE_PRESETS[0].profile })
  const [disclosures, setDisclosures] = useState<DisclosureState>({ ...PROFILE_PRESETS[0].disclosures })
  const selectedCount = selectedDisclosureCount(disclosures)
  const allFieldsFilled = Object.values(profile).every((value) => value.trim().length > 0)

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

    if (!allFieldsFilled || selectedCount < 2) {
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
      <header className="composer-heading">
        <p className="eyebrow">SEARCHABLE PERSON / 00</p>
        <h1>오늘 하루를 시작할 사람을 만들어 주세요.</h1>
        <p>입력값은 이 탭 안에서만 사용되고 새로고침하면 사라집니다. 모두 허구의 정보로 구성하세요.</p>
      </header>

      <form autoComplete="off" className="composer-form" onSubmit={handleSubmit}>
        <div className="profile-card">
          <div className="profile-card-topline">
            <span>PERSON / 28</span>
            <button className="text-button" onClick={loadNextPreset} type="button">
              다른 가상 인물
            </button>
          </div>
          <div className="avatar-placeholder" aria-hidden="true">
            <span>{profile.name.slice(0, 1)}</span>
          </div>
          <TextField label="이름" onChange={(value) => updateProfile('name', value)} value={profile.name} />
          <label className="field-label">
            <span>공개 프로필 사진</span>
            <select
              value={profile.profilePhoto}
              onChange={(event) => updateProfile('profilePhoto', event.target.value)}
            >
              {PHOTO_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <fieldset className="field-group">
          <legend>직장과 생활권</legend>
          <div className="field-grid">
            <TextField label="회사" onChange={(value) => updateProfile('company', value)} value={profile.company} />
            <TextField label="직무" onChange={(value) => updateProfile('role', value)} value={profile.role} />
            <TextField
              label="사는 동네"
              onChange={(value) => updateProfile('neighborhood', value)}
              value={profile.neighborhood}
            />
            <TextField
              label="이용하는 역"
              onChange={(value) => updateProfile('station', value)}
              value={profile.station}
            />
            <div className="field-span">
              <TextField
                label="자주 가는 장소"
                onChange={(value) => updateProfile('place', value)}
                value={profile.place}
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="field-group">
          <legend>관계와 계정</legend>
          <div className="field-grid">
            <TextField
              label="가장 가까운 친구"
              onChange={(value) => updateProfile('friend', value)}
              value={profile.friend}
            />
            <TextField
              label="자주 연락하는 가족"
              onChange={(value) => updateProfile('family', value)}
              value={profile.family}
            />
            <TextField
              label="공개 계정"
              onChange={(value) => updateProfile('account', value.replace(/^@/, ''))}
              value={profile.account}
            />
            <TextField
              inputMode="numeric"
              label="연락처 끝 네 자리"
              maxLength={4}
              onChange={(value) => updateProfile('phoneSuffix', value.replace(/\D/g, '').slice(0, 4))}
              value={profile.phoneSuffix}
            />
          </div>
        </fieldset>

        <fieldset className="disclosure-fieldset">
          <div className="disclosure-heading">
            <legend>이 인물에게서 공개적으로 찾을 수 있는 정보</legend>
            <span>{selectedCount}개 선택</span>
          </div>
          <div className="disclosure-list">
            {DISCLOSURES.map((key) => (
              <button
                aria-pressed={disclosures[key]}
                className="disclosure-option"
                data-selected={disclosures[key]}
                key={key}
                onClick={() => toggleDisclosure(key)}
                type="button"
              >
                <span className="selection-mark" aria-hidden="true" />
                <span>
                  <strong>{DISCLOSURE_LABELS[key]}</strong>
                  <small>{disclosureValue(key, profile)}</small>
                </span>
              </button>
            ))}
          </div>
          {selectedCount < 2 ? <p className="field-message">두 가지 이상 선택해야 합니다.</p> : null}
        </fieldset>

        <button className="start-button" disabled={!allFieldsFilled || selectedCount < 2} type="submit">
          이 사람으로 시작하기
          <span aria-hidden="true">→</span>
        </button>
      </form>
    </section>
  )
}

function TextField({ label, value, onChange, inputMode = 'text', maxLength }: TextFieldProps) {
  return (
    <label className="field-label">
      <span>{label}</span>
      <input
        inputMode={inputMode}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        value={value}
      />
    </label>
  )
}
