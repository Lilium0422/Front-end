import { User } from "@/types";
import { mockUsers } from "./mockData";
import apiClient from "./apiClient";

const STORAGE_KEY = "ott_current_user";

// 개발 모드: Mock 사용 여부
const USE_MOCK = true; // API 준비되면 false로 변경

export const authService = {
  // 이메일/닉네임 중복 확인
  checkAvailability: async (
    type: "email" | "nickname",
    value: string,
  ): Promise<{ isAvailable: boolean; message: string }> => {
    if (USE_MOCK) {
      // Mock 응답
      await new Promise((resolve) => setTimeout(resolve, 300));
      return {
        isAvailable: true,
        message: "사용 가능합니다.",
      };
    }

    try {
      const response = await apiClient.get("/api/auth/check", {
        params: { type, value },
      });
      return response.data;
    } catch (error) {
      throw new Error("중복 확인에 실패했습니다.");
    }
  },

  // 로그인
  login: async (email: string, password: string): Promise<User> => {
    if (USE_MOCK) {
      // Mock 로그인
      await new Promise((resolve) => setTimeout(resolve, 500));

      const user = mockUsers.find(
        (u) => u.email === email && u.password === password,
      );
      if (!user) {
        throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
      }

      const { password: _, ...userWithoutPassword } = user;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userWithoutPassword));
      return userWithoutPassword;
    }

    // 실제 API 호출
    try {
      const response = await apiClient.post("/api/auth/login/email", {
        email,
        password,
      });

      const { accessToken, refreshToken, expiresIn } = response.data;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("tokenExpiresIn", expiresIn.toString());

      // TODO: /api/users/me API 호출하여 실제 사용자 정보 가져오기
      const user: User = {
        id: "temp",
        email,
        nickname: "사용자",
        preferredTags: [],
        subscriptionType: "none",
        isLGUPlus: false,
        joinDate: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      return user;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
      }
      throw new Error("로그인에 실패했습니다. 다시 시도해주세요.");
    }
  },

  // 회원가입
  signup: async (
    email: string,
    password: string,
    nickname: string,
    preferredTags: string[],
    isLGUPlus: boolean,
  ): Promise<User> => {
    if (USE_MOCK) {
      // Mock 회원가입
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (mockUsers.some((u) => u.email === email)) {
        throw new Error("이미 사용 중인 이메일입니다.");
      }

      if (mockUsers.some((u) => u.nickname === nickname)) {
        throw new Error("이미 사용 중인 닉네임입니다.");
      }

      const newUser: User = {
        id: `user${Date.now()}`,
        email,
        nickname,
        preferredTags,
        subscriptionType: isLGUPlus ? "basic" : "none",
        isLGUPlus,
        joinDate: new Date().toISOString(),
        password,
      };

      mockUsers.push(newUser);
      const { password: _, ...userWithoutPassword } = newUser;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userWithoutPassword));
      return userWithoutPassword;
    }

    // 실제 API 호출
    try {
      const response = await apiClient.post("/api/auth/signup/email", {
        email,
        password,
        nickname,
        preferenceTags: preferredTags,
      });

      const newUser: User = {
        id: response.data.memberId.toString(),
        email: response.data.email,
        nickname: response.data.nickname,
        preferredTags,
        subscriptionType: isLGUPlus ? "basic" : "none",
        isLGUPlus,
        joinDate: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      return newUser;
    } catch (error: any) {
      if (error.response?.status === 409) {
        throw new Error("이미 사용 중인 이메일 또는 닉네임입니다.");
      } else if (error.response?.status === 400) {
        throw new Error(
          error.response?.data?.message || "입력 정보를 확인해주세요.",
        );
      }
      throw new Error("회원가입에 실패했습니다. 다시 시도해주세요.");
    }
  },

  // 로그아웃
  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("tokenExpiresIn");
  },

  // 현재 사용자 가져오기
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem(STORAGE_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  // 사용자 정보 업데이트
  updateUser: async (userId: string, updates: Partial<User>): Promise<User> => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const userIndex = mockUsers.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      throw new Error("사용자를 찾을 수 없습니다.");
    }

    mockUsers[userIndex] = { ...mockUsers[userIndex], ...updates };
    const { password: _, ...userWithoutPassword } = mockUsers[userIndex];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userWithoutPassword));
    return userWithoutPassword;
  },

  // 구독 처리
  subscribe: async (
    userId: string,
    subscriptionType: "basic" | "premium",
  ): Promise<User> => {
    await new Promise((resolve) => setTimeout(resolve, 1000)); // 결제 시뮬레이션
    return authService.updateUser(userId, { subscriptionType });
  },

  // 회원 탈퇴
  deleteAccount: async (userId: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const index = mockUsers.findIndex((u) => u.id === userId);
    if (index !== -1) {
      mockUsers.splice(index, 1);
    }
    localStorage.removeItem(STORAGE_KEY);
  },
};
