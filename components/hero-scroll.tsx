import ScrollExpandMedia from '@/components/ui/scroll-expansion-hero';

// The new homepage hero. The picture that opens up, and the one behind it. Replace these two
// files (or their addresses) to change the photography; nothing else needs touching.
const IMAGES = {
  background: '/assets/img/hero/model-4.webp',
  media: '/assets/img/hero/model-3.webp',
  mediaAlt: 'PHirst homes at night',
};

/** True when the page was opened on a section address such as /calculator. */
function openedOnSection() {
  return (location.pathname.replace(/\/+$/, '') || '/') !== '/' || location.hash.length > 1;
}

export function HeroScroll() {
  return (
    <ScrollExpandMedia
      mediaType="image"
      mediaSrc={IMAGES.media}
      mediaAlt={IMAGES.mediaAlt}
      bgImageSrc={IMAGES.background}
      title="PHirst Homes"
      date="Team M-BigTime"
      scrollToExpand="Scroll to explore"
      startExpanded={openedOnSection()}
    />
  );
}
