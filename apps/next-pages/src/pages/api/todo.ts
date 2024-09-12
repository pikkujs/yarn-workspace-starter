import type { NextApiRequest, NextApiResponse } from "next";
import { getVramework } from "../../../vramework";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const method = req.method?.toLowerCase()
  let route = method == 'post' ? '/todo' : '/todo/:todoId'
  const vramework = await getVramework()
  await vramework.apiRequest(req, res, {
    type: method as any,
    route,
  })
}

