export interface DeletedReferredPost {
  isDeleted: true
}

export interface LiveReferredPost {
  isDeleted?: false
  id: number
  createdAt: Date
  updatedAt?: Date
  content?: string | null
  imageURLs?: string[] | null
  author?: {
    id: string
    name: string
    username: string | null
    image?: string | null
  } | null
}

export type ReferredPost = DeletedReferredPost | LiveReferredPost
