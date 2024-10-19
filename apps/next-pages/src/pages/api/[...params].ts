import type { NextApiRequest, NextApiResponse } from 'next'
import { vramework } from '@/generated/vramework-nextjs'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const routeParts = req.query.params as string[]
  await vramework().apiRequest(
    req, 
    res, 
    `/${routeParts.join('/')}` as any, 
    req.method!.toLowerCase()
  )
}
