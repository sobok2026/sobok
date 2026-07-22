export type Messages = { [key: string]: MessageValue }
type MessageValue = string | { [key: string]: MessageValue }
