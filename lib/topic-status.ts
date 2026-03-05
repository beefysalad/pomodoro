export const TOPIC_STATUSES = [
  'BACKLOG',
  'TO_STUDY',
  'IN_PROGRESS',
  'DONE',
] as const

export type TopicStatus = (typeof TOPIC_STATUSES)[number]

export const TOPIC_STATUS_LABEL: Record<TopicStatus, string> = {
  BACKLOG: 'Backlog',
  TO_STUDY: 'To Study',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
}
