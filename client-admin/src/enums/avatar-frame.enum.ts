export enum AvatarFrame {
  GOLD = 'gold',
  SILVER = 'silver',
  BRONZE = 'bronze',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond',
  RAINBOW = 'rainbow',
  FIRE = 'fire',
  ICE = 'ice',
}

export const AvatarFrameLabels: Record<AvatarFrame, string> = {
  [AvatarFrame.GOLD]: 'Золото',
  [AvatarFrame.SILVER]: 'Серебро',
  [AvatarFrame.BRONZE]: 'Бронза',
  [AvatarFrame.PLATINUM]: 'Платина',
  [AvatarFrame.DIAMOND]: 'Алмаз',
  [AvatarFrame.RAINBOW]: 'Радуга',
  [AvatarFrame.FIRE]: 'Огонь',
  [AvatarFrame.ICE]: 'Лёд',
};

