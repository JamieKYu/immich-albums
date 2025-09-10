"use client";
import { useState, useRef, useEffect } from "react";
import AlbumGrid from "@/components/AlbumGrid";
import YearNavigation from "@/components/YearNavigation";
import { createApiUrl } from "@/lib/basePath";

interface Album {
  id: string;
  albumName: string;
  albumThumbnailAssetId: string;
  startDate?: string;
  [key: string]: unknown;
}

export default function Page() {
  const [albumsByYear, setAlbumsByYear] = useState<Record<string, Album[]>>({});
  const [sortedYears, setSortedYears] = useState<string[]>([]);
  const yearRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    const initializeData = async () => {
      const response = await fetch(createApiUrl("/albums"));
      const albumsData: Album[] = await response.json();
      
      // Group albums by year from startDate
      const albumsByYearData = albumsData.reduce((acc: Record<string, Album[]>, album: Album) => {
        if (album.startDate) {
          const year = new Date(album.startDate).getFullYear().toString();
          if (!acc[year]) {
            acc[year] = [];
          }
          acc[year].push(album);
        }
        return acc;
      }, {});
      
      // Sort years in descending order
      const sortedYearsData = Object.keys(albumsByYearData).sort((a, b) => parseInt(b) - parseInt(a));
      
      // Sort albums within each year by startDate (descending)
      sortedYearsData.forEach(year => {
        albumsByYearData[year].sort((a: Album, b: Album) => 
          new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime()
        );
      });
      
      setAlbumsByYear(albumsByYearData);
      setSortedYears(sortedYearsData);
      setIsDataLoaded(true);
    };
    
    initializeData();
  }, []);

  // Save scroll position when page unloads (browser navigation)
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.setItem('albumsScrollPosition', window.scrollY.toString());
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Restore scroll position when returning to page
  useEffect(() => {
    if (!isDataLoaded) return;

    const restoreScrollPosition = () => {
      const savedPosition = sessionStorage.getItem('albumsScrollPosition');
      if (savedPosition) {
        const scrollY = parseInt(savedPosition, 10);
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          window.scrollTo({
            top: scrollY,
            behavior: 'instant' // Use instant for seamless restoration
          });
        });
        // Clear the saved position after restoring
        sessionStorage.removeItem('albumsScrollPosition');
      }
    };

    // Small delay to ensure all content is rendered
    const timer = setTimeout(restoreScrollPosition, 100);
    
    return () => clearTimeout(timer);
  }, [isDataLoaded]);

  const scrollToYear = (year: string) => {
    const element = yearRefs.current[year];
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };
  
  return (
    <main className="min-h-screen bg-stone-200">
        <h1 className="text-5xl font-bold p-6 text-center text-black font-caveat italic">Photo Albums</h1>
        <div className="md:pr-20">
          {sortedYears.map(year => (
            <div 
              key={year} 
              className="mb-12"
              ref={(el) => { yearRefs.current[year] = el; }}
            >
              <h2 className="text-4xl font-bold text-left text-black px-6 pb-4 font-caveat italic">
                {year}
              </h2>
              <AlbumGrid albums={albumsByYear[year]} />
            </div>
          ))}
        </div>
        
        <YearNavigation 
          years={sortedYears} 
          onYearSelect={scrollToYear}
          yearRefs={yearRefs}
        />
    </main>
  );
}
