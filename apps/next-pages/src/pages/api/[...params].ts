import type { NextApiRequest, NextApiResponse } from 'next'
import { vramework } from '../../../vramework'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const routeParts = req.query.params as string[]
  await vramework().apiRequest(req, res, {
    type: req.method!.toLowerCase() as any,
    route: `/${routeParts.join('/')}`,
  })
}
