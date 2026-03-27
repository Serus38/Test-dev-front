export interface IdReference {
  id: number;
}

export interface LocationReference {
  id: number;
  name?: string;
  city?: string;
  country?: string;
}

export class MaritimeShipment {
  constructor(
    public id: number,
    public deliveryDate: string,
    public destinationPort: LocationReference,
    public discountRate: number,
    public fleetNumber: string,
    public guideNumber: string,
    public originPort: LocationReference,
    public productType: string,
    public quantity: number,
    public registrationDate: string,
    public shippingCost: number,
    public status: string,
    public totalCost: number,
    public client: IdReference,
  ) {}
}
