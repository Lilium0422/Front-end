import axios from "axios";

// Admin API는 8082 포트 (vite 프록시로 /admin → localhost:8082)
const adminClient = axios.create({
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// 타입 정의
export interface AdminUser {
  userId: number;
  name: string;
  createdAt: string;
  loginMethods: { authProvider: string; identifier: string }[];
}

export interface AdminUserDetail {
  user: {
    userId: number;
    nickname: string;
    userStatus: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  };
  subscription: {
    subscriptionId: number;
    planType: string;
    subscriptionStatus: string;
    startedAt: string;
    expiresAt: string;
  } | null;
  paymentHistory: {
    paymentId: number;
    amount: number;
    paymentStatus: string;
    paymentMethod: string;
    requestAt: string;
    approvedAt: string | null;
  }[];
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const adminService = {
  // 사용자 목록 조회
  getUsers: async (params?: {
    search?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<AdminUser>> => {
    const response = await adminClient.get("/admin/users", { params });
    return response.data;
  },

  // 사용자 상세 조회
  getUserDetail: async (userId: number): Promise<AdminUserDetail> => {
    const response = await adminClient.get(`/admin/users/${userId}`);
    return response.data;
  },
};
