// Edge Function URL を直接クライアントに晒さない
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const rsp = await fetch(
    `${process.env.SUPABASE_FUNC_URL}/handle_prompts_insert`,
    { method: 'POST', headers: req.headers as HeadersInit, body: req.body }
  )
  res.status(rsp.status).end(await rsp.text())
} 