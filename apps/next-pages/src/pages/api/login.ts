import type { NextApiRequest, NextApiResponse } from 'next'
import { vramework } from '../../../vramework'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await vramework().apiRequest(req, res, '/login', 'post')
}
