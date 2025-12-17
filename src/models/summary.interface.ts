export interface ISummary {
    summaryId: string;
    emailGroupId: string;
    shipment_data: ShipmentRequest;
    summary: string;
    status: 'pending' | 'approved' | 'rejected' | 'processing' | 'failed';
    createdAt: string;
    updatedAt: string;
}

export interface IEmailGroup {
    emailGroupId: string;
    userId?: number;
    createdAt: string;
    updatedAt: string;
    emails?: any[];
    summary?: ISummary;
    summaries?: ISummary[];
}

export type ShipmentRequest = {
    name: string;
    shipment_details: Array<{
        shipping_date_from: string | null;
        shipping_date_to: string | null;
        shipping_time_from: string | null;
        shipping_time_to: string | null;
        arrival_date_from: string | null;
        arrival_date_to: string | null;
        arrival_time_from: string | null;
        arrival_time_to: string | null;
        address_from: ShipmentAddress;
        address_dest: ShipmentAddress;
        contents: ShipmentContent[];
    }>;
    modes: ShipmentMode[];
    for_carriers?: string;
};

export type ShipmentAddress = {
    country: string | null;
    city: string | null;
    zipcode: string | null;
    address: string | null;
    date_from: string | null;
    date_to: string | null;
    time_from: string | null;
    time_to: string | null;
};

export type ShipmentContent = {
    name: string;
    quantity: number;
};

export type ShipmentMode = {
    name: string;
};

export interface IApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}