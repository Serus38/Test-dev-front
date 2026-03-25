export class MaritimeShipment {
  constructor(
    public id: number,
    public deliveryDate: string,
    public destination: string,
    public discountRate: number,
    public fleetNumber: string,
    public guideNumber: string,
    public origin: string,
    public productType: string,
    public quantity: number,
    public registrationDate: string,
    public shippingCost: number,
    public status: string,
    public totalCost: number,
    public client_id: number,
    public port_id: number,
    public qr_code: string,
  ) {}
}
