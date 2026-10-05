export type DecisionStatus =
  | 'INVASION_ALERT'
  | 'PROTECTION_PRIORITY'
  | 'MONITORING_GAP'
  | 'STABLE'
  | 'INSUFFICIENT_DATA';

export interface DecisionStatusMeta {
  code: DecisionStatus;
  label: string;
  badgeColor: string; // Quasar color name
  hexColor: string;
  icon: string;
  summary: string;
  rationale: string;
  recommendedAction: string;
}

export const DECISION_STATUSES: Record<DecisionStatus, DecisionStatusMeta> = {
  INVASION_ALERT: {
    code: 'INVASION_ALERT',
    label: 'Invasion Alert',
    badgeColor: 'red-8',
    hexColor: '#D32F2F',
    icon: 'warning',
    summary: 'Invasive species share is climbing year-over-year or dominating recent recorded catches.',
    rationale:
      'Consecutive increases in recorded observations of introduced/invasive species (e.g. Glossogobius giuris, Oreochromis niloticus) outcompeting or replacing endemic cyprinids. [ADD SOURCE: Ismail et al. / Lake Lanao Fisheries Baseline]',
    recommendedAction:
      'Prioritize targeted invasive control measures, gear selectivity monitoring, and community catch reporting in municipal waters.',
  },
  PROTECTION_PRIORITY: {
    code: 'PROTECTION_PRIORITY',
    label: 'Protection Priority',
    badgeColor: 'purple-8',
    hexColor: '#7B1FA2',
    icon: 'shield',
    summary: 'Endemic cyprinid species missing or unrecorded for 4+ consecutive years in this zone.',
    rationale:
      'Historic endemic species have not been recorded in recent observation cycles despite active surveys, placing them at severe risk of local extirpation. [ADD SOURCE: IUCN Freshwater Fish Specialist Group]',
    recommendedAction:
      'Establish localized fish sanctuary zones, ban fine-mesh netting in littoral nursery grounds, and initiate targeted conservation surveys.',
  },
  MONITORING_GAP: {
    code: 'MONITORING_GAP',
    label: 'Monitoring Gap',
    badgeColor: 'amber-9',
    hexColor: '#F57C00',
    icon: 'hourglass_empty',
    summary: 'No field observations recorded in this municipality for 2 or more consecutive years.',
    rationale:
      'Survey discontinuity prevents reliable ecological health scoring and leaves catch pressure unmeasured. [ADD SOURCE: PhilFIDA / BARMM MAFAR Monitoring Protocols]',
    recommendedAction:
      'Deploy scheduled field sampling expeditions and engage local fisherfolk associations for participatory catch monitoring.',
  },
  STABLE: {
    code: 'STABLE',
    label: 'Stable',
    badgeColor: 'teal-7',
    hexColor: '#00897B',
    icon: 'check_circle',
    summary: 'Balanced ratio of endemic cyprinid observations with consistent multi-year survey coverage.',
    rationale:
      'Annual records demonstrate regular presence of native taxa with moderate invasive proportions and active monitoring. [ADD SOURCE: MSU-Marawi Limnological Station Records]',
    recommendedAction:
      'Maintain routine quarterly surveys and preserve existing shoreline littoral habitats.',
  },
  INSUFFICIENT_DATA: {
    code: 'INSUFFICIENT_DATA',
    label: 'Insufficient Data',
    badgeColor: 'grey-7',
    hexColor: '#757575',
    icon: 'help_outline',
    summary: 'Fewer than 5 recorded observations logged in this municipality overall.',
    rationale:
      'Total sample size is too small to compute dependable invasion indices or presence/absence trends without statistical bias. [ADD SOURCE: Standard FAO Inland Fisheries Assessment Guidelines]',
    recommendedAction:
      'Conduct baseline exploratory biodiversity surveys to establish initial species presence.',
  },
};
