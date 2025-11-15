'use client';

import { forwardRef, useImperativeHandle, useState, useRef } from "react";
import type { ProjectData } from "@/app/()/projects/types";

export interface ProjectVideoSectionRef {
  showVideo: () => void;
  scrollToVideo: () => void;
}

interface ProjectVideoSectionProps {
  project: ProjectData;
}

const ProjectVideoSection = forwardRef<ProjectVideoSectionRef, ProjectVideoSectionProps>(({ project }, ref) => {
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  const videoRef = useRef<HTMLDivElement>(null);

  const showVideo = () => {
    setIsVideoVisible(true);
  };

  const scrollToVideo = () => {
    if (!isVideoVisible) {
      setIsVideoVisible(true);
    }
    // Delay para asegurar que el elemento esté visible
    setTimeout(() => {
      const videoElement = videoRef.current;
      if (videoElement) {
        videoElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  useImperativeHandle(ref, () => ({
    showVideo,
    scrollToVideo
  }), []);

  if (!project.video_pitch) return null;

  // Si el video no está visible, no renderizar nada (ocultar todo el espacio)
  if (!isVideoVisible) {
    return null;
  }

  return (
    <div ref={videoRef} className="mb-8" data-video-section>
      <div className="aspect-video bg-zinc-900 rounded-xl overflow-hidden">
        {(() => {
          let embedUrl = '';

          if (project.video_pitch && (project.video_pitch.includes('youtube.com') || project.video_pitch.includes('youtu.be'))) {
            let videoId = '';
            if (project.video_pitch.includes('youtube.com')) {
              const vParam = project.video_pitch.split('v=')?.[1];
              videoId = vParam?.split('&')?.[0] ?? '';
            } else if (project.video_pitch.includes('youtu.be/')) {
              const pathSegment = project.video_pitch.split('/')?.pop();
              videoId = pathSegment?.split('?')?.[0] ?? '';
            }

            if (videoId && videoId.length > 0) {
              embedUrl = `https://www.youtube.com/embed/${videoId}`;
            }
          } else if (project.video_pitch?.includes('vimeo.com')) {
            const videoId = project.video_pitch.split('/')?.pop();
            if (videoId) {
              embedUrl = `https://player.vimeo.com/video/${videoId}`;
            }
          }

          if (embedUrl) {
            return (
              <iframe
                src={embedUrl}
                title={`${project.title} Video Pitch`}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            );
          } else {
            return (
              <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-400 mb-2">URL del video inválida</p>
                  <p className="text-xs text-gray-500">URL recibida: {project.video_pitch}</p>
                </div>
              </div>
            );
          }
        })()}
      </div>
    </div>
  );
});

ProjectVideoSection.displayName = 'ProjectVideoSection';

export default ProjectVideoSection;
