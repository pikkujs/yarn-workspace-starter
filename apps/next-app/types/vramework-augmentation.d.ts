// types/vramework-augmentation.d.ts

import { RoutesInterface } from '@todos/functions/generated/routes';
import { IncomingMessage, ServerResponse } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { VrameworkNextJS } from '@vramework/deploy-next';

declare module '@vramework/deploy-next' {
  interface VrameworkNextJS {
    actionRequest<R extends RoutesInterface>(
      route: R,
      data: R['input']
    ): Promise<R['output']>;

    ssrRequest<R extends RoutesInterface>(
      request: IncomingMessage & {
        cookies: Partial<{ [key: string]: string }>;
      },
      response: ServerResponse<IncomingMessage>,
      route: R,
      data: R['input']
    ): Promise<R['output']>;

    apiRequest<R extends RoutesInterface>(
      request: NextApiRequest,
      response: NextApiResponse,
      route: R
    ): Promise<void>;
  }
}
