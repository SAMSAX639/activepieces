import {
  createTrigger,
  TriggerStrategy,
  Property,
  StoreScope
} from '@activepieces/pieces-framework';
import axios from 'axios';
import { Campaign, Auth, BaseURL } from '../types';

export const inboundCallReceived = createTrigger({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'inboundCallReceived',
  displayName: 'Inbound call received',
  description: 'Triggers when inbound call is received, with call variables.',
  props: {
    campaign: Property.Dropdown({
      displayName: 'Campaign',
      description: 'Select a campaign',
      required: true,
      refreshers: ['auth'],
      refreshOnSearch: true,
      options: async ({ auth }, { searchValue }) => {
        const { auth_key, user_id } = auth as Auth;
        const response: { data: { campaigns: Campaign[] } } = await axios.get(
          `${BaseURL}/campaign?userId=${user_id}`,
          {
            headers: {
              Authorization: `Bearer ${auth_key}`,
            },
          }
        );
        return {
          options: response.data.campaigns
            .filter((campaign) =>
              searchValue ? campaign.name.startsWith(searchValue) : true
            )
            .map((campaign) => ({
              label: campaign.name,
              value: campaign.id,
            })),
        };
      },
    }),
  },
  sampleData: { from: '+1234567890', to: '+0987654321' },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // implement webhook creation logic
    const { auth_key } = context.auth as Auth;
    const response = await axios.post(
      `${BaseURL}/campaign`,
      {
        webhook: context.webhookUrl,
        campaignId: context.propsValue.campaign,
        triggerType: 'INWARD_CALL',
      },
      {
        headers: {
          Authorization: `Bearer ${auth_key}`,
        },
      }
    );
    context.store.put('icWebhookId', response.data.webhookId, StoreScope.FLOW);
  },
  async onDisable(context) {
    // implement webhook deletion logic
    const { auth_key } = context.auth as Auth;
    const webhookId = context.store.get('icWebhookId', StoreScope.FLOW);
    await axios.delete(
      `${BaseURL}/campaign?campaignId=${context.propsValue.campaign}&webhookId=${webhookId}`,
      {
        headers: {
          Authorization: `Bearer ${auth_key}`,
        },
      }
    );
    context.store.delete('icWebhookId', StoreScope.FLOW);
  },
  async run(context) {
    return [context.payload.body];
  },
});
