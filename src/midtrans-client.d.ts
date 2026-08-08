declare module 'midtrans-client' {
  type MidtransConfig = {
    isProduction: boolean;
    serverKey: string;
    clientKey: string;
  };

  type SnapTransactionRequest = Record<string, unknown>;
  type SnapTransactionResponse = {
    token: string;
    redirect_url: string;
  };

  type TransactionStatusResponse = {
    order_id?: string;
    transaction_status?: string;
    fraud_status?: string;
    payment_type?: string;
    gross_amount?: string | number;
  };

  class Snap {
    constructor(config: MidtransConfig);
    createTransaction(parameter: SnapTransactionRequest): Promise<SnapTransactionResponse>;
  }

  class CoreApi {
    constructor(config: MidtransConfig);
    transaction: {
      status(orderId: string): Promise<TransactionStatusResponse>;
      notification(notificationBody: Record<string, unknown>): Promise<TransactionStatusResponse>;
    };
  }

  const midtransClient: {
    Snap: typeof Snap;
    CoreApi: typeof CoreApi;
  };

  export default midtransClient;
}
