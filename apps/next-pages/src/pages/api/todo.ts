import type { NextApiRequest, NextApiResponse } from 'next'
import { vramework } from '../../../vramework'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const method = req.method?.toLowerCase()
  let route = method == 'post' ? '/todo' : '/todo/:todoId'
  await vramework().apiRequest(req, res, {
    type: method as any,
    route,
  })
}
