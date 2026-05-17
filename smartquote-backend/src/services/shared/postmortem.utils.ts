// smartquote_backend/src/services/shared/postmortem.utils.ts
import { aiService } from '../ai/index';
import { createModuleLogger } from '../../lib/logger';

const log = createModuleLogger('postmortem');

export function triggerPostMortem(
    userId: string,
    offerId: string,
    outcome: 'ACCEPTED' | 'REJECTED',
    source: string = 'unknown'
): void {
    aiService.generatePostMortem(userId, offerId, outcome)
        .then(() => {
            log.info({ offerId, outcome, source }, 'Post-mortem generated');
        })
        .catch((err: unknown) => {
            log.error({ err, offerId, outcome, source }, 'Post-mortem failed');
        });
}
