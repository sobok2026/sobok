// Compile-time exhaustiveness checking (calling this with anything but `never` is a type error) doubles
// as a runtime guard: if a phase/action variant ever reaches here despite that, it's a real bug and
// should fail loudly instead of rendering a raw state object or silently doing nothing.
export function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`)
}
