import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { phoneCallEnded } from './lib/triggers/phone-call-ended';
import { inboundCallReceived } from './lib/triggers/inbound-call-received';
import { addLeadToCampaign } from './lib/actions/add-lead-to-campaign';

export const callbeast = createPiece({
  displayName: 'Callbeast',
  auth: PieceAuth.CustomAuth({
    required: true,
    props: {
      user_id: Property.LongText({
        displayName: 'User Id',
        required: true,
      }),
      auth_key: Property.LongText({
        displayName: 'Auth key',
        required: true,
      }),
    },
  }),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://aicall.center/logo.png',
  authors: [],
  actions: [addLeadToCampaign],
  triggers: [phoneCallEnded, inboundCallReceived],
});
