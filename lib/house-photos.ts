// Written by design/house-models/make-photos.py: how many pictures each house has per group.
// The pictures are /assets/img/models/photos/<house>/<group>-NN.webp (and NN-t.webp for the thumbnail).
export const PHOTO_COUNTS: { [house: string]: { exterior: number; interior: number; floorplan: number } } = {
  'alora': { exterior: 8, interior: 8, floorplan: 1 },
  'amani': { exterior: 8, interior: 13, floorplan: 1 },
  'brenna': { exterior: 2, interior: 8, floorplan: 0 },
  'calista': { exterior: 8, interior: 7, floorplan: 3 },
  'cartland-54': { exterior: 8, interior: 8, floorplan: 2 },
  'charles-150': { exterior: 8, interior: 8, floorplan: 2 },
  'charles-70': { exterior: 8, interior: 8, floorplan: 2 },
  'christie-90': { exterior: 8, interior: 8, floorplan: 2 },
  'corin-120': { exterior: 8, interior: 8, floorplan: 2 },
  'dua': { exterior: 5, interior: 5, floorplan: 0 },
  'unna': { exterior: 6, interior: 5, floorplan: 1 },
};
