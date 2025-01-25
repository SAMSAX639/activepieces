import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { phoneCallEnded } from './lib/triggers/phone-call-ended';
import { inboundCallReceived } from './lib/triggers/inbound-call-received';
import { addLeadToCampaign } from './lib/actions/add-lead-to-campaign';

export const callbeast = createPiece({
  displayName: 'Callbeast',
  auth: PieceAuth.CustomAuth({
    required: true,
    props: {}
  }),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://callbeast.com/logo.png',
  authors: [],
  actions: [addLeadToCampaign],
  triggers: [phoneCallEnded, inboundCallReceived],
});
