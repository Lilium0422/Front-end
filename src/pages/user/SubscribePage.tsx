import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Crown, Phone, Shield, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscriptionService,
  type SubscriptionInfo,
} from "@/services/subscriptionService";
import ConfirmModal from "@/components/common/ConfirmModal";

const SubscribePage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null);
  const [loadingSub, setLoadingSub] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [canceling, setCanceling] = useState(false);

  // U+ 인증
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    loadSubscription();
  }, [user, authLoading]);

  const loadSubscription = async () => {
    setLoadingSub(true);
    try {
      const info = await subscriptionService.getMySubscription();
      setSubInfo(info);
    } catch (error: any) {
      // 구독 정보 없으면 null
      setSubInfo(null);
    } finally {
      setLoadingSub(false);
    }
  };

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      await subscriptionService.subscribe("CARD");
      alert("베이직 구독이 완료되었습니다!");
      // 토큰 재발급으로 paid 상태 갱신
      await refreshAuth();
      loadSubscription();
    } catch (error: any) {
      const msg =
        error.response?.data?.message || "구독 처리 중 오류가 발생했습니다.";
      alert(msg);
    } finally {
      setSubscribing(false);
    }
  };

  const handleCancel = async () => {
    setCanceling(true);
    try {
      await subscriptionService.cancelSubscription();
      setShowCancelModal(false);
      alert("구독 해지가 예약되었습니다. 만료일까지 이용 가능합니다.");
      await refreshAuth();
      loadSubscription();
    } catch (error: any) {
      const msg = error.response?.data?.message || "구독 해지에 실패했습니다.";
      alert(msg);
    } finally {
      setCanceling(false);
    }
  };

  const handleVerifyUplus = async () => {
    if (!phoneNumber.trim()) {
      alert("전화번호를 입력해주세요.");
      return;
    }
    // 숫자만 추출
    const cleaned = phoneNumber.replace(/[^0-9]/g, "");
    if (cleaned.length < 10) {
      alert("올바른 전화번호를 입력해주세요.");
      return;
    }

    setVerifying(true);
    setVerifyResult(null);
    try {
      const result = await subscriptionService.verifyUplus(cleaned);
      if (result.verified) {
        setVerifyResult("success");
        await refreshAuth();
        loadSubscription();
      } else {
        setVerifyResult("fail");
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || "인증에 실패했습니다.";
      setVerifyResult("fail");
      alert(msg);
    } finally {
      setVerifying(false);
    }
  };

  // 토큰 재발급으로 auth 상태 갱신
  const refreshAuth = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        const { default: axios } = await import("axios");
        const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
        const response = await axios.post(
          `${baseUrl}/api/auth/reissue`,
          { refreshToken },
          { headers: { "Content-Type": "application/json" } },
        );
        const { accessToken, refreshToken: newRefresh } = response.data.data;
        localStorage.setItem("accessToken", accessToken);
        if (newRefresh) localStorage.setItem("refreshToken", newRefresh);
      }
    } catch {
      // 재발급 실패는 무시
    }
  };

  const isPaid = subInfo?.paid === true;
  const isUplus = user?.isLGUPlus === true;
  const isActive = subInfo?.displayStatus === "ACTIVE";
  const isCanceled = subInfo?.subscriptionStatus === "CANCELED";

  const getMemberStatus = () => {
    if (isUplus) return "LG U+ 회원";
    if (isPaid) return "베이직 구독 회원";
    return "일반 회원";
  };

  if (authLoading || loadingSub) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-dark py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-6">구독 및 멤버십</h1>
          <div className="bg-gray-900 rounded-lg p-6 max-w-md mx-auto flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">구독 상태</p>
              <p className="text-xl font-bold">{getMemberStatus()}</p>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-bold ${
                isUplus
                  ? "bg-green-500/20 text-green-400"
                  : isPaid
                    ? "bg-primary/20 text-primary"
                    : "bg-gray-700 text-gray-400"
              }`}
            >
              {isUplus
                ? "U+ 인증"
                : isPaid
                  ? isCanceled
                    ? "해지 예약"
                    : "구독 중"
                  : "미구독"}
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* 카드 1: 베이직 구독 */}
          <div className="bg-gray-900 rounded-lg p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">베이직 구독</h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  isPaid
                    ? "bg-primary/20 text-primary"
                    : "bg-gray-700 text-gray-400"
                }`}
              >
                {isPaid ? (isCanceled ? "해지 예약" : "구독 중") : "미구독"}
              </span>
            </div>

            <div className="text-3xl font-bold text-primary mb-6">
              ₩5,000<span className="text-lg text-gray-400">/월</span>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <Check className="w-5 h-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
                <span>BASIC 콘텐츠 무제한 시청</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
                <span>HD 1080p 화질</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
                <span>배속 재생 기능</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
                <span>광고 없음</span>
              </li>
            </ul>

            {/* 구독 상세 정보 (구독 중일 때) */}
            {isPaid && subInfo && (
              <div className="bg-gray-800 rounded-lg p-4 mb-6 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">시작일</span>
                  <span>
                    {new Date(subInfo.startedAt).toLocaleDateString("ko-KR")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">만료일</span>
                  <span>
                    {new Date(subInfo.expiresAt).toLocaleDateString("ko-KR")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">상태</span>
                  <span
                    className={
                      isCanceled ? "text-yellow-400" : "text-green-400"
                    }
                  >
                    {isCanceled ? "해지 예약 (만료일까지 이용 가능)" : "활성"}
                  </span>
                </div>
              </div>
            )}

            {isUplus ? (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center">
                <Shield className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-blue-400 font-semibold text-sm">
                  LG U+ 회원으로 인증되어 베이직 구독이 필요하지 않습니다.
                </p>
              </div>
            ) : !isPaid ? (
              <button
                onClick={handleSubscribe}
                disabled={subscribing}
                className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {subscribing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    처리 중...
                  </>
                ) : (
                  "베이직 플랜 구독하기"
                )}
              </button>
            ) : isCanceled ? (
              <div className="space-y-3">
                <button
                  onClick={handleSubscribe}
                  disabled={subscribing}
                  className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {subscribing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      처리 중...
                    </>
                  ) : (
                    "다시 구독하기"
                  )}
                </button>
                <p className="text-xs text-gray-500 text-center">
                  해지 예약 상태입니다. 만료일까지 이용 가능하며, 다시 구독하면
                  해지가 취소됩니다.
                </p>
              </div>
            ) : (
              <button
                onClick={() => setShowCancelModal(true)}
                className="w-full py-3 rounded transition-colors bg-gray-700 hover:bg-gray-600 text-white"
              >
                구독 해지
              </button>
            )}
          </div>

          {/* 카드 2: LG U+ 회원 인증 */}
          <div className="bg-gray-900 rounded-lg p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">LG U+ 회원 인증</h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  isUplus
                    ? "bg-green-500/20 text-green-400"
                    : "bg-gray-700 text-gray-400"
                }`}
              >
                {isUplus ? "인증 완료" : "미인증"}
              </span>
            </div>

            <p className="text-gray-400 mb-6">
              LG U+ 회원 인증 시 제공되는 혜택/연동 안내
            </p>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <Check className="w-5 h-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
                <span>모든 콘텐츠 무제한 시청 (오리지널 포함)</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
                <span>4K UHD 화질 지원</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
                <span>베이직 구독의 모든 혜택 포함</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
                <span>통신사 회원 전용 혜택</span>
              </li>
            </ul>

            {isUplus ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                <Shield className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-green-400 font-semibold">인증 완료</p>
              </div>
            ) : isPaid ? (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
                <Crown className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-yellow-400 font-semibold text-sm">
                  베이직 구독 중에는 U+ 인증을 할 수 없습니다.
                  {isCanceled
                    ? " 구독 만료 후 인증해주세요."
                    : " 구독 해지 후 인증해주세요."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    전화번호 입력
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="01012345678"
                    className="w-full input-field"
                    maxLength={13}
                  />
                </div>

                {verifyResult === "fail" && (
                  <p className="text-red-400 text-sm">
                    LG U+ 회원이 아니거나 인증에 실패했습니다.
                  </p>
                )}
                {verifyResult === "success" && (
                  <p className="text-green-400 text-sm">
                    LG U+ 회원 인증이 완료되었습니다!
                  </p>
                )}

                <button
                  onClick={handleVerifyUplus}
                  disabled={verifying || !phoneNumber.trim()}
                  className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      인증 중...
                    </>
                  ) : (
                    "LG U+ 회원 인증하기"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 구독 해지 확인 모달 */}
      {showCancelModal && (
        <ConfirmModal
          message="정말 구독을 해지하시겠습니까? 만료일까지는 계속 이용 가능합니다."
          confirmText="해지"
          cancelText="취소"
          onConfirm={handleCancel}
          onCancel={() => setShowCancelModal(false)}
        />
      )}
    </div>
  );
};

export default SubscribePage;
