import type { NextApiRequest, NextApiResponse } from 'next'
import { vramework } from '@/vramework-nextjs'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const method = req.method!.toLowerCase()
  let route = method == 'post' ? '/todo' : '/todo/:todoId'
  await vramework().apiRequest(
    req, 
    res, 
    route as any,
    method
  )
}
