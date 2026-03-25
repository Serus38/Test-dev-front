export interface IdReference {
  id: number;
}

export interface LocationReference {
  id: number;
  name?: string;
  city?: string;
  country?: string;
}

export class TerrestrialShipment {
  constructor(
    public id: number,
    public productType: string,
    public quantity: number,
    public originBodega: LocationReference | null,
    public destinationBodega: LocationReference | null,
    public originPort: LocationReference | null,
    public destinationPort: LocationReference | null,
    public registrationDate: string,
    public deliveryDate: string,
    public client: IdReference,
    public shippingCost: number,
    public discountRate: number,
    public totalCost: number,
    public guideNumber: string,
    public vehiclePlate: string,
    public status: string,
  ) {}
}
