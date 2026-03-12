import React, { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  Share2,
  Bookmark,
  Info,
  X,
  Send,
  User,
  Eye,
  Clock,
  Tag,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// 임시 목 데이터 (백엔드 API 연동 전)
interface CreatorVideo {
  videoId: number;
  contentId: number;
  title: string;
  videoUrl: string;
  durationSec: number;
  viewCount: number;
  uploaderName: string;
  uploaderProfileImg: string | null;
  tags: string[];
  createdAt: string;
  bookmarkCount: number;
  commentCount: number;
}

const MOCK_VIDEOS: CreatorVideo[] = [
  {
    videoId: 1,
    contentId: 101,
    title: "오버워치 힐러 우양 벽 뒤를 쏘기 위한 팁",
    videoUrl: "",
    durationSec: 185,
    viewCount: 12400,
    uploaderName: "mo_ve_",
    uploaderProfileImg: null,
    tags: ["게임", "오버워치", "팁"],
    createdAt: "2026-03-10T14:30:00",
    bookmarkCount: 342,
    commentCount: 76,
  },
  {
    videoId: 2,
    contentId: 102,
    title: "3분만에 배우는 리액트 커스텀 훅",
    videoUrl: "",
    durationSec: 195,
    viewCount: 8700,
    uploaderName: "dev_master",
    uploaderProfileImg: null,
    tags: ["개발", "리액트", "프론트엔드"],
    createdAt: "2026-03-09T10:00:00",
    bookmarkCount: 521,
    commentCount: 43,
  },
  {
    videoId: 3,
    contentId: 103,
    title: "서울 숨은 맛집 투어 EP.12 - 을지로 골목",
    videoUrl: "",
    durationSec: 240,
    viewCount: 31200,
    uploaderName: "food_hunter",
    uploaderProfileImg: null,
    tags: ["맛집", "서울", "을지로"],
    createdAt: "2026-03-08T18:00:00",
    bookmarkCount: 890,
    commentCount: 128,
  },
];

interface MockComment {
  commentId: number;
  nickname: string;
  profileImageUrl: string | null;
  body: string;
  createdAt: string;
}

const MOCK_COMMENTS: MockComment[] = [
  {
    commentId: 1,
    nickname: "Queens_Road",
    profileImageUrl: null,
    body: "교수님 진도가 너무 빨라요",
    createdAt: "2026-03-13T09:00:00",
  },
  {
    commentId: 2,
    nickname: "billionaireking0127",
    profileImageUrl: null,
    body: "우리보고 그렇게 쏘라는거임?ㅋㅋㅋㅋㅋ",
    createdAt: "2026-03-13T11:00:00",
  },
  {
    commentId: 3,
    nickname: "댓글지킴이_i7z",
    profileImageUrl: null,
    body: "평타 직빵으로 맞춰서 죽이면 도파민 터짐 ㅋㅋㅋㅋㅋ",
    createdAt: "2026-03-13T10:00:00",
  },
  {
    commentId: 4,
    nickname: "pldb4885",
    profileImageUrl: null,
    body: "진짜 엄청 잘쏘시네 ㅋㅋ",
    createdAt: "2026-03-13T09:30:00",
  },
  {
    commentId: 5,
    nickname: "kokomimi1557",
    profileImageUrl: null,
    body: "누나 보다 훨씬 강한 동생",
    createdAt: "2026-03-13T10:30:00",
  },
  {
    commentId: 6,
    nickname: "smilexd4717",
    profileImageUrl: null,
    body: "진짜 잘 쏘시네요...",
    createdAt: "2026-03-13T09:15:00",
  },
];

// 시간 포맷
const formatTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "방금 전";
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
};

const formatDuration = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const formatCount = (n: number) => {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}만`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}천`;
  return n.toString();
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getDate().toString().padStart(2, "0")}`;
};

type PanelType = "comments" | "info" | null;

const CreatorPage: React.FC = () => {
  const { user } = useAuth();
  const [videos] = useState<CreatorVideo[]>(MOCK_VIDEOS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [openPanel, setOpenPanel] = useState<PanelType>(null);
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set());
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<MockComment[]>(MOCK_COMMENTS);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentVideo = videos[currentIndex];

  // 스크롤 스냅으로 현재 영상 인덱스 추적
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const height = container.clientHeight;
      const idx = Math.round(scrollTop / height);
      if (idx !== currentIndex && idx >= 0 && idx < videos.length) {
        setCurrentIndex(idx);
        setOpenPanel(null); // 영상 바뀌면 패널 닫기
      }
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [currentIndex, videos.length]);

  const toggleBookmark = (videoId: number) => {
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (next.has(videoId)) next.delete(videoId);
      else next.add(videoId);
      return next;
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("URL이 복사되었습니다.");
  };

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    const newComment: MockComment = {
      commentId: Date.now(),
      nickname: user?.nickname || "익명",
      profileImageUrl: null,
      body: commentText.trim(),
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => [newComment, ...prev]);
    setCommentText("");
  };

  const togglePanel = (panel: PanelType) => {
    setOpenPanel((prev) => (prev === panel ? null : panel));
  };

  return (
    <div className="fixed inset-0 top-16 flex justify-center bg-dark overflow-hidden">
      {/* 메인 컨테이너: 영상 + 사이드 버튼 + 패널 */}
      <div className="flex items-start gap-0 relative h-full">
        {/* 영상 영역 */}
        <div className="relative h-full" style={{ width: "480px" }}>
          <div
            ref={containerRef}
            className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
            {videos.map((video) => (
              <div
                key={video.videoId}
                className="h-full snap-start relative flex items-center justify-center bg-black flex-shrink-0"
                style={{ minHeight: "100%" }}
              >
                {/* 영상 자리 (검은 배경 + 로딩 표시) */}
                <div className="w-full h-full bg-black flex items-center justify-center">
                  <span className="text-gray-600 text-sm">영상 로딩 중...</span>
                </div>

                {/* 하단 오버레이: 업로더 정보 + 제목 */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                  {/* 업로더 */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {video.uploaderProfileImg ? (
                        <img
                          src={video.uploaderProfileImg}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <span className="font-semibold text-sm">
                      @{video.uploaderName}
                    </span>
                  </div>
                  {/* 제목 */}
                  <p className="text-sm leading-snug line-clamp-2">
                    {video.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 사이드 액션 버튼 */}
        <div className="flex flex-col items-center justify-end gap-5 px-3 h-full pb-28">
          {/* 댓글 */}
          <button
            onClick={() => togglePanel("comments")}
            className={`flex flex-col items-center gap-1 transition-colors ${openPanel === "comments" ? "text-primary" : "text-white hover:text-gray-300"}`}
          >
            <div className="w-11 h-11 rounded-full bg-gray-800/80 flex items-center justify-center">
              <MessageCircle className="w-6 h-6" />
            </div>
            <span className="text-xs">
              {formatCount(currentVideo.commentCount)}
            </span>
          </button>

          {/* 북마크 */}
          <button
            onClick={() => toggleBookmark(currentVideo.videoId)}
            className="flex flex-col items-center gap-1 transition-colors"
          >
            <div className="w-11 h-11 rounded-full bg-gray-800/80 flex items-center justify-center">
              <Bookmark
                className={`w-6 h-6 ${bookmarked.has(currentVideo.videoId) ? "fill-primary text-primary" : "text-white"}`}
              />
            </div>
            <span className="text-xs">
              {formatCount(
                currentVideo.bookmarkCount +
                  (bookmarked.has(currentVideo.videoId) ? 1 : 0),
              )}
            </span>
          </button>

          {/* 공유 */}
          <button
            onClick={handleShare}
            className="flex flex-col items-center gap-1 text-white hover:text-gray-300 transition-colors"
          >
            <div className="w-11 h-11 rounded-full bg-gray-800/80 flex items-center justify-center">
              <Share2 className="w-6 h-6" />
            </div>
            <span className="text-xs">공유</span>
          </button>

          {/* 영상 정보 */}
          <button
            onClick={() => togglePanel("info")}
            className={`flex flex-col items-center gap-1 transition-colors ${openPanel === "info" ? "text-primary" : "text-white hover:text-gray-300"}`}
          >
            <div className="w-11 h-11 rounded-full bg-gray-800/80 flex items-center justify-center">
              <Info className="w-6 h-6" />
            </div>
            <span className="text-xs">정보</span>
          </button>
        </div>

        {/* 사이드 패널 (댓글 / 영상 정보) - 슬라이드 애니메이션 */}
        <div
          className="bg-gray-900 border-l border-gray-800 flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out"
          style={{
            width: openPanel ? "380px" : "0px",
            opacity: openPanel ? 1 : 0,
          }}
        >
          <div
            style={{ width: "380px", minWidth: "380px" }}
            className="h-full flex flex-col"
          >
            {/* 패널 헤더 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <h3 className="font-semibold text-lg">
                {openPanel === "comments"
                  ? `댓글 ${comments.length}`
                  : "영상 정보"}
              </h3>
              <button
                onClick={() => setOpenPanel(null)}
                className="p-1 hover:bg-gray-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 패널 내용 */}
            {openPanel === "comments" ? (
              <>
                {/* 댓글 목록 */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {comments.map((c) => (
                    <div key={c.commentId} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {c.profileImageUrl ? (
                          <img
                            src={c.profileImageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-bold text-gray-400">
                            {c.nickname.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold">
                            @{c.nickname}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(c.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          {c.body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 댓글 입력 */}
                <div className="border-t border-gray-800 p-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSubmitComment()
                    }
                    placeholder="댓글 추가..."
                    className="flex-1 bg-transparent border-b border-gray-700 focus:border-primary outline-none py-1.5 text-sm"
                  />
                  <button
                    onClick={handleSubmitComment}
                    disabled={!commentText.trim()}
                    className="p-2 text-primary disabled:text-gray-600 transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              /* 영상 정보 패널 */
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* 제목 */}
                <div>
                  <h4 className="text-xl font-bold leading-snug">
                    {currentVideo.title}
                  </h4>
                </div>

                {/* 업로더 */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                    {currentVideo.uploaderProfileImg ? (
                      <img
                        src={currentVideo.uploaderProfileImg}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <span className="font-semibold">
                    @{currentVideo.uploaderName}
                  </span>
                </div>

                <div className="border-t border-gray-800" />

                {/* 정보 항목들 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400">영상 길이</span>
                    <span className="ml-auto">
                      {formatDuration(currentVideo.durationSec)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Eye className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400">조회수</span>
                    <span className="ml-auto">
                      {currentVideo.viewCount.toLocaleString()}회
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Bookmark className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400">찜</span>
                    <span className="ml-auto">
                      {currentVideo.bookmarkCount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400">업로드</span>
                    <span className="ml-auto">
                      {formatDate(currentVideo.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-800" />

                {/* 태그 */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-400">태그</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentVideo.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-gray-800 px-3 py-1 rounded-full text-sm text-gray-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorPage;
