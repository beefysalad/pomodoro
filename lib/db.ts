import prisma from './prisma'

// Extracts the type of the `tx` parameter from prisma.$transaction's
// interactive-callback overload, so Db covers both the shared client and a
// transaction client without depending on Prisma's internal type names.
type TransactionCallback<T> = (tx: T) => Promise<unknown>
type ExtractTx<F> = F extends (fn: TransactionCallback<infer T>, options?: any) => any
  ? T
  : never

export type Db = typeof prisma | ExtractTx<typeof prisma.$transaction>
