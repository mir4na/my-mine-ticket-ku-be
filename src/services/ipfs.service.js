import axios from 'axios';
import { config } from '../config/index.js';

class IPFSService {
  async uploadMetadata(metadata) {
    try {
      const response = await axios.post(
        `${config.ipfs.apiUrl}/add`,
        JSON.stringify(metadata),
        {
          headers: {
            'Authorization': `Bearer ${config.ipfs.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return `${config.ipfs.gateway}${response.data.Hash}`;
    } catch (error) {
      throw new Error(`IPFS upload failed: ${error.message}`);
    }
  }

  async uploadTicketMetadata(ticketData) {
    const metadata = {
      name: `Ticket #${ticketData.ticketId}`,
      description: `Ticket for ${ticketData.eventName}`,
      image: ticketData.eventBanner,
      attributes: [
        {
          trait_type: 'Event',
          value: ticketData.eventName,
        },
        {
          trait_type: 'Ticket Type',
          value: ticketData.ticketType,
        },
        {
          trait_type: 'Price',
          value: ticketData.price.toString(),
        },
        {
          trait_type: 'Purchase Date',
          value: ticketData.purchaseDate,
        },
      ],
    };

    return await this.uploadMetadata(metadata);
  }
}

export const ipfsService = new IPFSService();
