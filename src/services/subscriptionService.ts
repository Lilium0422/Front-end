import apiClient from "./apiClient";

export interface SubscriptionInfo {
  subscriptionId: number;
  grade: string; // SUB_BASIC 등
  subscriptionStatus: string; // ACTIVE, CANCELED, EXPIRED
  displayStatus: string; // ACTIVE, EXPIRED
  startedAt: string;
  expiresAt: string;
  paid: boolean;
}

export interface SubscribeResult {
  paymentId: number;
  amount: number;
  paymentStatus: string;
  paymentProvider: string;
  subscriptionId: number;
  planType: string;
  expiresAt: string;
}

export interface UplusVerifyResult {
  verified: boolean;
  phoneNumber: string;
  verifiedAt: string;
}

export interface CancelResult {
  subscriptionId: number;
  grade: string;
  subscriptionStatus: string;
  expiresAt: string;
  paid: boolean;
}

export const subscriptionService = {
  /** 내 구독 상세 조회 */
  getMySubscription: async (): Promise<SubscriptionInfo> => {
    const response = await apiClient.get("/api/subscriptions/me");
    return response.data.data;
  },

  /** 베이직 구독 (Mock 결제) */
  subscribe: async (
    paymentProvider: string = "CARD",
  ): Promise<SubscribeResult> => {
    const idempotencyKey = crypto.randomUUID();
    const response = await apiClient.post(
      "/api/payments/subscribe",
      { paymentProvider },
      { headers: { "Idempotency-Key": idempotencyKey } },
    );
    return response.data.data;
  },

  /** LG U+ 회원 인증 */
  verifyUplus: async (phoneNumber: string): Promise<UplusVerifyResult> => {
    const response = await apiClient.post("/api/membership/uplus/verify", {
      phoneNumber,
    });
    return response.data.data;
  },

  /** 구독 해지 */
  cancelSubscription: async (): Promise<CancelResult> => {
    const response = await apiClient.post("/api/membership/cancel");
    return response.data.data;
  },
};
