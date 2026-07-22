import { postJson } from '../lib/apiClient';
import type {
  GenerateAdviceRequestBody,
  GenerateAdviceResponseBody,
} from '../../../package/shared-types/types';

/**
 * 釣行記録をもとにAIアドバイスを生成する
 */
export async function generateAdvice(data: GenerateAdviceRequestBody): Promise<string> {
  const response = await postJson<GenerateAdviceResponseBody>('/advice', data);
  return response.advice;
}
