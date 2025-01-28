import {
  createTrigger,
  TriggerStrategy,
  Property,
  StoreScope,
} from '@activepieces/pieces-framework';
import axios from 'axios';
import { Campaign, Auth, BaseURL } from '../types';

export const phoneCallEnded = createTrigger({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'phoneCallEnded',
  displayName: 'Phone call ended',
  description: 'Triggers when phone call ends, with conversation variables.',
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
  sampleData: {
    status: 'COMPLETED',
    duration: 120,
    transcript: [
      {
        message: 'Hi! How are you, John?',
        role: 'agent',
      },
      {
        message: 'Im fine. How about you?',
        role: 'user',
      },
      {
        message: 'Im doing well, thank you for asking.',
        role: 'agent',
      },
      {
        message: 'How can I assist you today?',
        role: 'user',
      },
    ],
    customer_phone: '+16380991171',
    campaign_phone: '+16380991171',
    input_variables: {
      customer_name: 'John',
    },
    extracted_variables: {
      status: false,
      summary: 'Call ended without clear objective being met.',
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // implement webhook creation logic
    const { auth_key } = context.auth as Auth;
    const response = await axios.post(
      `${BaseURL}/campaign`,
      {
        webhook: context.webhookUrl,
        campaignId: context.propsValue.campaign,
        triggerType: 'PHONE_CALL_ENDED',
      },
      {
        headers: {
          Authorization: `Bearer ${auth_key}`,
        },
      }
    );
    await context.store.put('pceWebhookId', response.data.webhookId, StoreScope.FLOW);
  },
  async onDisable(context) {
    // implement webhook deletion logic
    const webhookId = await context.store.get('pceWebhookId', StoreScope.FLOW);
    const { auth_key } = context.auth as Auth;
    await axios.delete(
      `${BaseURL}/campaign?campaignId=${context.propsValue.campaign}&webhookId=${webhookId}`,
      {
        headers: {
          Authorization: `Bearer ${auth_key}`,
        },
      }
    );
    await context.store.delete('pceWebhookId', StoreScope.FLOW);
  },
  async run(context) {
    return [context.payload.body];
  },
});
