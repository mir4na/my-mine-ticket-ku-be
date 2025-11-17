import axios from 'axios';
import { config } from '../config/index.js';

class IPFSService {
    async uploadMetadata(metadata) {
        try {
            const response = await axios.post(
                'https://api.pinata.cloud/pinning/pinJSONToIPFS',
                {
                    pinataContent: metadata,
                    pinataMetadata: {
                        name: `ticket-metadata-${Date.now()}`
                    }
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'pinata_api_key': config.ipfs.apiKey,
                        'pinata_secret_api_key': config.ipfs.apiSecret,
                    },
                    timeout: 30000,
                }
            );

            return `${config.ipfs.gateway}${response.data.IpfsHash}`;
        } catch (error) {
            console.error('❌ IPFS upload error:', error.response?.data || error.message);
            
            const mockHash = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const mockUri = `${config.ipfs.gateway}${mockHash}`;
            console.warn(`⚠️ Using mock IPFS URI: ${mockUri}`);
            return mockUri;
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