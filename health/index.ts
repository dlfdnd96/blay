import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import * as PlayBusRes from '../Shared/resObj';

const health = (
  context: Context,
  req: HttpRequest,
): void => {
  context.res = PlayBusRes.SUCCESS.CUSTOM_MESSAGE(
    'Function app is warmed up'
  );
  return;
};

export default health;