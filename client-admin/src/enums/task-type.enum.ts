export const TaskType = {
  COMMUNITY_SUBSCRIBE: 'community_subscribe',
  COMPLETE_CONTRACT: 'complete_contract',
  COMPLETE_TRAINING: 'complete_training',
  FRIEND_INVITE: 'friend_invite',
} as const;

export type TaskType = typeof TaskType[keyof typeof TaskType];

export const TaskTypeLabels: Record<TaskType, string> = {
  [TaskType.COMMUNITY_SUBSCRIBE]: 'Подписка на сообщество',
  [TaskType.COMPLETE_CONTRACT]: 'Выполнить контракт',
  [TaskType.COMPLETE_TRAINING]: 'Выполнить тренировку',
  [TaskType.FRIEND_INVITE]: 'Пригласить друга',
};

