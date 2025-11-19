export enum ProductType {
  NICKNAME_COLOR = 'nickname_color',
  NICKNAME_ICON = 'nickname_icon',
  AVATAR_FRAME = 'avatar_frame',
  GUARD = 'guard',
  SHIELD = 'shield',
}

export const ProductTypeLabels: Record<ProductType, string> = {
  [ProductType.NICKNAME_COLOR]: 'Цвет ника',
  [ProductType.NICKNAME_ICON]: 'Иконка ника',
  [ProductType.AVATAR_FRAME]: 'Рамка аватара',
  [ProductType.GUARD]: 'Страж',
  [ProductType.SHIELD]: 'Щит',
};

