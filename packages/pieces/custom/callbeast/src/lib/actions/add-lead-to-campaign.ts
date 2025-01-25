import { createAction, Property } from '@activepieces/pieces-framework';
import { Auth, Campaign, BaseURL } from '../types';
import axios from 'axios';

export const addLeadToCampaign = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'addLeadToACampaign',
  displayName: 'Add lead to a campaign',
  description: 'Add lead to an outbound campaign, to be called by agent.',
  props: {
    campaign: Property.Dropdown({
      displayName: 'Campaign',
      description: 'The campaign to add lead',
      required: true,
      refreshers: ['auth'],
      refreshOnSearch: true,
      options: async ({ auth }, { searchValue }) => {
        const { auth_key, user_id } = auth as Auth;
        const response: { data: { campaigns: Campaign[] } } = await axios.get(
          `${BaseURL}/campaign?userId=${user_id}&type=${'OUTWARD'}`,
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
    allowDuplicates: Property.Checkbox({
      displayName: 'Allow duplicates',
      description: 'Allow adding duplicate leads to the campaign',
      required: true,
      defaultValue: false,
    }),
    phoneNumber: Property.ShortText({
      displayName: 'Customer phone number',
      description: 'The phone number of the customer to add to the campaign',
      required: true,
    }),
    customerName: Property.ShortText({
      displayName: 'Customer name',
      description: 'The name of the customer to add to the campaign',
      required: true,
    }),
    customerEmail: Property.ShortText({
      displayName: 'Customer email',
      description: 'The email of the customer to add to the campaign',
      required: false,
    }),
    variables: Property.Json({
      displayName: 'Variables',
      description: 'The variables to add to the campaign',
      required: false,
    }),
  },
  async run(context) {
    // Action logic here
    const { auth_key, user_id } = context.auth as Auth;
    const props = context.propsValue;
    await axios.post(
      `${BaseURL}/lead`,
      {
        lead: {
          phoneNumber: props.phoneNumber,
          name: props.customerName,
          email: props.customerEmail,
          variables: props.variables,
        },
        campaignId: props.campaign,
        userId: user_id,
        allowDuplicate: props.allowDuplicates,
      },
      {
        headers: {
          Authorization: `Bearer ${auth_key}`,
        },
      }
    );
  },
});
