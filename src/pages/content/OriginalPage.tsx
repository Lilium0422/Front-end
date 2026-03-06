import React, { useEffect, useState, useRef, useCallback } from "react";
import { Crown } from "lucide-react";
import { Content } from "@/types";
import { contentService } from "@/services/contentService";
import ContentCard from "@/components/content/ContentCard";
import ContentModal from "@/components/content/ContentModal";

const OriginalPage: React.FC = () => {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingMoreRef = useRef(false);
  const pageRef = useRef(0);

  useEffect(() => {
    window.scrollTo(0, 0); // 페이지 최상단으로 스크롤
    loadInitialContents();
  }, []);

  const loadInitialContents = async () => {
    setLoading(true);
    try {
      // 필터링 없이 전체 콘텐츠 가져오기
      const data = await contentService.getDefaultContentList({
        page: 0,
        size: 30,
      });
      setContents(data);
      if (data.length < 30) {
        setHasMore(false);
      }
      pageRef.current = 0;
    } catch (error) {
      console.error("콘텐츠 로딩 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreContents = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;

    try {
      const nextPage = pageRef.current + 1;
      // 필터링 없이 전체 콘텐츠 가져오기
      const newContents = await contentService.getDefaultContentList({
        page: nextPage,
        size: 30,
      });

      if (newContents.length < 30) {
        setHasMore(false);
      }

      setContents((prev) => [...prev, ...newContents]);
      pageRef.current = nextPage;
    } catch (error) {
      console.error("추가 콘텐츠 로딩 실패:", error);
    } finally {
      loadingMoreRef.current = false;
    }
  }, [hasMore]);

  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node || !hasMore) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            loadMoreContents();
          }
        },
        { threshold: 0.1 },
      );
      observerRef.current.observe(node);
    },
    [loadMoreContents, hasMore],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-3">
            <Crown className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">오리지널 콘텐츠</h1>
          </div>
          <p className="text-xl text-gray-400">
            독점 제공되는 프리미엄 오리지널 콘텐츠를 만나보세요
          </p>
        </div>

        {contents.length === 0 ? (
          <div className="text-center py-20">
            <Crown className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-gray-400">오리지널 콘텐츠가 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {contents.map((content) => (
                <ContentCard
                  key={content.id}
                  content={content}
                  onCardClick={setSelectedContent}
                />
              ))}
            </div>

            {/* 무한스크롤 로딩 트리거 */}
            {hasMore && (
              <div ref={loadMoreRef} className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {!hasMore && contents.length > 0 && (
              <div className="text-center py-8 text-gray-400">
                모든 콘텐츠를 불러왔습니다.
              </div>
            )}
          </>
        )}
      </div>

      {selectedContent && (
        <ContentModal
          content={selectedContent}
          onClose={() => setSelectedContent(null)}
        />
      )}
    </div>
  );
};

export default OriginalPage;
