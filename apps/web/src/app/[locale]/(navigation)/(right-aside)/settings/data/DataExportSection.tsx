import { db } from '@sobok/db/app'
import { bookmarkTable, readingHistoryTable, userRatingTable } from '@sobok/db/app/activity'
import { userCensorshipTable } from '@sobok/db/app/censorship'
import { libraryTable } from '@sobok/db/app/library'
import { eq } from 'drizzle-orm'

import DataExportSectionClient from './DataExportSectionClient'

type Props = {
  userId: string
}

export default async function DataExportSection({ userId }: Props) {
  const counts = await getDataCounts(userId)

  return <DataExportSectionClient counts={counts} />
}

async function getDataCounts(userId: string) {
  const [history, bookmarks, ratings, libraries, censorships] = await Promise.all([
    db.$count(readingHistoryTable, eq(readingHistoryTable.userId, userId)),
    db.$count(bookmarkTable, eq(bookmarkTable.userId, userId)),
    db.$count(userRatingTable, eq(userRatingTable.userId, userId)),
    db.$count(libraryTable, eq(libraryTable.userId, userId)),
    db.$count(userCensorshipTable, eq(userCensorshipTable.userId, userId)),
  ])

  return { history, bookmarks, ratings, libraries, censorships }
}
