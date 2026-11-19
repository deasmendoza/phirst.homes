import ScrollExpandMedia from '@/components/ui/scroll-expansion-hero';

// The new homepage hero. The picture that opens up, and the one behind it. Replace these two
// files (or their addresses) to change the photography; nothing else needs touching.
const IMAGES = {
  background: '/assets/img/hero/community-night.webp',
  media: '/assets/img/hero/community-night-labels.webp',
  mediaAlt: 'A PHirst community at night with each house model labelled: Aurora, Amani, Alora, Callista, Brenna, Unna, Dua, Cartland 54, Charles 70, Christie 90, Corin 120 and Charles 150',
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
      title="Team M|BIGTIME"
      scrollToExpand="Scroll to explore"
      startExpanded={openedOnSection()}
    />
  );
}
