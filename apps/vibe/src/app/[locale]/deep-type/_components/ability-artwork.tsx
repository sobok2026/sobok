import type { AbilitySlug } from '@deep-type/rules/free'
import Image, { type StaticImageData } from 'next/image'

import alonePowerArt from '../_assets/abilities/alone-power.webp'
import careEyeArt from '../_assets/abilities/care-eye.webp'
import closenessCourageArt from '../_assets/abilities/closeness-courage.webp'
import deepFocusArt from '../_assets/abilities/deep-focus.webp'
import deepSoloArt from '../_assets/abilities/deep-solo.webp'
import emotionHoldArt from '../_assets/abilities/emotion-hold.webp'
import emotionOutArt from '../_assets/abilities/emotion-out.webp'
import factBreakArt from '../_assets/abilities/fact-break.webp'
import fartherFuelArt from '../_assets/abilities/farther-fuel.webp'
import fieldReadArt from '../_assets/abilities/field-read.webp'
import freshExpressionArt from '../_assets/abilities/fresh-expression.webp'
import heartConnectArt from '../_assets/abilities/heart-connect.webp'
import heartJudgmentArt from '../_assets/abilities/heart-judgment.webp'
import improviseOpenArt from '../_assets/abilities/improvise-open.webp'
import leadFieldArt from '../_assets/abilities/lead-field.webp'
import momentRideArt from '../_assets/abilities/moment-ride.webp'
import orderPowerArt from '../_assets/abilities/order-power.webp'
import peopleOnArt from '../_assets/abilities/people-on.webp'
import possibilityEyeArt from '../_assets/abilities/possibility-eye.webp'
import protectArt from '../_assets/abilities/protect.webp'
import quietPresenceArt from '../_assets/abilities/quiet-presence.webp'
import realityEyeArt from '../_assets/abilities/reality-eye.webp'
import recognitionFuelArt from '../_assets/abilities/recognition-fuel.webp'
import resonanceArt from '../_assets/abilities/resonance.webp'
import selfFuelArt from '../_assets/abilities/self-fuel.webp'
import soloFinishArt from '../_assets/abilities/solo-finish.webp'
import steadyCenterArt from '../_assets/abilities/steady-center.webp'
import steadyRootsArt from '../_assets/abilities/steady-roots.webp'
import stillnessArt from '../_assets/abilities/stillness.webp'
import storyFeelArt from '../_assets/abilities/story-feel.webp'
import structureJudgmentArt from '../_assets/abilities/structure-judgment.webp'
import warmthGuardArt from '../_assets/abilities/warmth-guard.webp'

/**
 * One card image per ability slug. The slug is the identity — `abilities.ts` says so, because the origin
 * renamed 21 of the 32 display names across its render wrappers while the slugs stayed put — so keying the art
 * by slug is what survives the next rename.
 */
const ABILITY_ARTWORK = {
  alone_power: alonePowerArt,
  care_eye: careEyeArt,
  closeness_courage: closenessCourageArt,
  deep_focus: deepFocusArt,
  deep_solo: deepSoloArt,
  emotion_hold: emotionHoldArt,
  emotion_out: emotionOutArt,
  fact_break: factBreakArt,
  farther_fuel: fartherFuelArt,
  field_read: fieldReadArt,
  fresh_expression: freshExpressionArt,
  heart_connect: heartConnectArt,
  heart_judgment: heartJudgmentArt,
  improvise_open: improviseOpenArt,
  lead_field: leadFieldArt,
  moment_ride: momentRideArt,
  order_power: orderPowerArt,
  people_on: peopleOnArt,
  possibility_eye: possibilityEyeArt,
  protect: protectArt,
  quiet_presence: quietPresenceArt,
  reality_eye: realityEyeArt,
  recognition_fuel: recognitionFuelArt,
  resonance: resonanceArt,
  self_fuel: selfFuelArt,
  solo_finish: soloFinishArt,
  steady_center: steadyCenterArt,
  steady_roots: steadyRootsArt,
  stillness: stillnessArt,
  story_feel: storyFeelArt,
  structure_judgment: structureJudgmentArt,
  warmth_guard: warmthGuardArt,
} satisfies Record<AbilitySlug, StaticImageData>

export function AbilityArtwork({ slug }: { slug: AbilitySlug }) {
  return (
    <Image
      alt=""
      className="w-24 shrink-0 self-stretch bg-page-soft object-cover sm:w-28"
      draggable={false}
      loading="lazy"
      sizes="112px"
      src={ABILITY_ARTWORK[slug]}
    />
  )
}
