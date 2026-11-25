import type { ApiRequestLike, ApiResponseLike } from '../lib/neonBackend.ts';
import { handleNeonApiRequest } from '../lib/neonBackend.ts';

export default async function handler(
  req: ApiRequestLike,
  res: ApiResponseLike
) {
  await handleNeonApiRequest(req, res);
}
