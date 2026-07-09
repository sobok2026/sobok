import { encryptSecret } from '@sobok/auth/secret-crypto'
import { type PUTV1ChatPayoutAccountResponse, putV1ChatPayoutAccountBodySchema } from '@sobok/contracts'
import { getChatArtistByUserId } from '@sobok/db/app/query/chat'
import { upsertPayoutAccount } from '@sobok/db/app/query/payout'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { maskAccountNumber } from '../lib'

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(requireAuth, zProblemValidator('json', putV1ChatPayoutAccountBodySchema))

// 정산 입금 계좌 등록/변경 — 아티스트 본인만. 계좌번호는 암호화 저장한다.
route.put('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const body = c.req.valid('json')
  const artist = await getChatArtistByUserId(userId)

  if (!artist) {
    return problemResponse(c, { status: 404 })
  }

  await upsertPayoutAccount({
    userId,
    bankName: body.bankName,
    accountNumber: encryptSecret(body.accountNumber),
    holderName: body.holderName,
  })

  const response = {
    account: {
      bankName: body.bankName,
      accountNumberMasked: maskAccountNumber(body.accountNumber),
      holderName: body.holderName,
    },
  } satisfies PUTV1ChatPayoutAccountResponse

  return c.json(response)
})

export default route
