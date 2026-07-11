import { auth } from '@sobok/auth/server'
import { db } from '@sobok/db/app'
import { user } from '@sobok/db/app/auth'
import { chatArtistTable } from '@sobok/db/app/chat'
import { invoiceTable } from '@sobok/db/app/invoice'
import { subscriptionTable } from '@sobok/db/app/subscription'
import { SUBSCRIPTION_TARGET_CHAT_ARTIST } from '@sobok/domain/subscription/policy'
import { kafka, TOPIC_CHAT_MESSAGE, TOPIC_CHAT_PUSH_FANOUT } from '@sobok/events'
import { and, eq } from 'drizzle-orm'

const SEED_PASSWORD = 'qwe123123'

// better-auth signUp API로 시드해 credential account(비밀번호 해시)까지 프로덕션과 동일하게 만든다.
async function getOrCreateUser(username: string, name: string) {
  const email = `${username}@sobok.local`
  const [existing] = await db.select().from(user).where(eq(user.email, email)).limit(1)

  if (existing) {
    return existing
  }

  await auth.api.signUpEmail({
    body: { email, password: SEED_PASSWORD, name, username },
  })

  const [created] = await db.select().from(user).where(eq(user.email, email)).limit(1)
  return created
}

async function getOrCreateArtistProfile(userId: string, handle: string, displayName: string, emoji: string) {
  const [profile] = await db.select().from(chatArtistTable).where(eq(chatArtistTable.userId, userId)).limit(1)

  if (profile) {
    return profile
  }

  const [inserted] = await db
    .insert(chatArtistTable)
    .values({
      userId,
      handle,
      displayName,
      emoji,
      isActive: true,
      priceAmount: 4900,
      priceCurrency: 'KRW',
    })
    .returning()

  return inserted
}

async function createChatTopics() {
  const admin = kafka.admin()
  await admin.connect()
  await admin.createTopics({ topics: [{ topic: TOPIC_CHAT_MESSAGE }, { topic: TOPIC_CHAT_PUSH_FANOUT }] })
  await admin.disconnect()
  console.log(`Created Kafka topics: ${TOPIC_CHAT_MESSAGE}, ${TOPIC_CHAT_PUSH_FANOUT}`)
}

async function main() {
  console.log('Seeding chat test data (3 Artists, 9 Fans)...')
  await createChatTopics()

  // 1. Create 3 Artists
  const artists = []
  for (let i = 1; i <= 3; i++) {
    const user = await getOrCreateUser(`cre${i}`, `Artist ${i}`)
    const profile = await getOrCreateArtistProfile(user.id, `cre${i}`, `Artist ${i}`, ['🔥', '✨', '🌟'][i - 1])
    artists.push(profile)
    console.log(`Created artist: cre${i}`)
  }

  // 2. Create 9 Fans (numbered 4 to 12)
  const fans = []
  for (let i = 4; i <= 12; i++) {
    const user = await getOrCreateUser(`fan${i}`, `Fan ${i}`)
    fans.push(user)
    console.log(`Created fan: fan${i}`)
  }

  // 3. Subscriptions: specific fans to specific artists
  // cre1 (artists[0]) -> fan4, fan5, fan6 (fans[0,1,2])
  // cre2 (artists[1]) -> fan7, fan8, fan9 (fans[3,4,5])
  // cre3 (artists[2]) -> fan10, fan11, fan12 (fans[6,7,8])
  for (let c = 0; c < artists.length; c++) {
    const artist = artists[c]
    const artistFans = fans.slice(c * 3, c * 3 + 3)

    for (const fan of artistFans) {
      let [subscription] = await db
        .select()
        .from(subscriptionTable)
        .where(
          and(
            eq(subscriptionTable.userId, fan.id),
            eq(subscriptionTable.targetType, SUBSCRIPTION_TARGET_CHAT_ARTIST),
            eq(subscriptionTable.targetId, artist.id),
          ),
        )
        .limit(1)

      if (!subscription) {
        const expiresAt = new Date()
        expiresAt.setFullYear(expiresAt.getFullYear() + 1)
        const [inserted] = await db
          .insert(subscriptionTable)
          .values({
            userId: fan.id,
            targetType: SUBSCRIPTION_TARGET_CHAT_ARTIST,
            targetId: artist.id,
            priceAmount: 1000,
            priceCurrency: 'KRW',
            status: 'active',
            expiresAt,
            autoRenew: true,
          })
          .returning()
        subscription = inserted
      }

      // 프로덕션 불변식(active 구독 ⟹ paid invoice)을 시드 데이터에도 유지해
      // paid-window 접근(listPaidIntervals)이 로컬에서 동작하게 한다.
      const [paidInvoice] = await db
        .select()
        .from(invoiceTable)
        .where(and(eq(invoiceTable.subscriptionId, subscription.id), eq(invoiceTable.status, 'paid')))
        .limit(1)

      if (!paidInvoice) {
        await db.insert(invoiceTable).values({
          subscriptionId: subscription.id,
          userId: fan.id,
          targetType: SUBSCRIPTION_TARGET_CHAT_ARTIST,
          targetId: artist.id,
          periodStart: subscription.createdAt,
          periodEnd: subscription.expiresAt,
          amount: subscription.priceAmount,
          currency: subscription.priceCurrency,
          status: 'paid',
          paidAt: subscription.createdAt,
        })
      }
    }
  }

  console.log('✅ Done! 3 Artists, 9 Fans (fan4~fan12), and subscriptions successfully seeded.')
  console.log('You can now log in as any fan (e.g. fan4@sobok.local / qwe123123) and visit /sobok/cre1')
  process.exit(0)
}

main().catch(console.error)
