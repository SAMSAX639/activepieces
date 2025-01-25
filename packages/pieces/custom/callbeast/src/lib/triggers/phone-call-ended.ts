import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import axios from 'axios';
import { Campaign, Auth } from '../types';

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
          `https://callbeast.com/api/activepieces/campaign?userId=${user_id}&type=${'OUTWARD'}`,
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
  sampleData: { id: 'campaign-id', name: 'Campaign Name' },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // implement webhook creation logic
    const { auth_key } = context.auth as Auth;
    await axios.post(
      `https://callbeast.com/api/activepieces/campaign`,
      { wenhook: context.webhookUrl, campaignId: context.propsValue.campaign, triggerType: 'phoneCallEnded' },
      {
        headers: {
          Authorization: `Bearer ${auth_key}`,
        },
      }
    );
  },
  async onDisable(context) {
    // implement webhook deletion logic
    const { auth_key } = context.auth as Auth;
    await axios.delete(
      `https://callbeast.com/api/activepieces/campaign?campaignId=${context.propsValue.campaign}&triggerType=phoneCallEnded`,
      {
        headers: {
          Authorization: `Bearer ${auth_key}`,
        },
      }
    );
  },
  async run(context) {
    return [context.payload.body];
  },
});
