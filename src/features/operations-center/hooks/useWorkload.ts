import { useMemo } from 'react';
import { CalendarEvent, EventCategory, EventModuleType } from '../types';

export interface ResourceCapacity {
  id: string;
  name: { en: string; ar: string };
  role: { en: string; ar: string };
  avatar: string;
  capacityIndex: number;
  meetingsCount: number;
  tendersCount: number;
  submissionsCount: number;
  assignedEventIds: string[];
}

export function useWorkload(events: CalendarEvent[]) {
  const resourceWorkloads = useMemo(() => {
    // Define active system resources
    const resources: ResourceCapacity[] = [
      {
        id: 'usr-sara',
        name: { en: 'Sara Al-Mansoori', ar: 'سارة المنصوري' },
        role: { en: 'PMO Estimation Coordinator', ar: 'منسق مكتب إدارة المشاريع' },
        avatar: 'S',
        capacityIndex: 0,
        meetingsCount: 0,
        tendersCount: 0,
        submissionsCount: 0,
        assignedEventIds: []
      },
      {
        id: 'usr-engineer',
        name: { en: 'Ahmed El-Din', ar: 'أحمد الدين' },
        role: { en: 'Senior Contracts Engineer', ar: 'مهندس عقود أول' },
        avatar: 'A',
        capacityIndex: 0,
        meetingsCount: 0,
        tendersCount: 0,
        submissionsCount: 0,
        assignedEventIds: []
      },
      {
        id: 'usr-mohamed',
        name: { en: 'Mohamed Al-Amri', ar: 'محمد العمري' },
        role: { en: 'Project Controls Specialist', ar: 'أخصائي التحكم في المشاريع' },
        avatar: 'M',
        capacityIndex: 0,
        meetingsCount: 0,
        tendersCount: 0,
        submissionsCount: 0,
        assignedEventIds: []
      },
      {
        id: 'usr-sarah',
        name: { en: 'Sarah Al-Mansoori', ar: 'سارة منصور' },
        role: { en: 'Senior Document Controller', ar: 'مراقب وثائق ومستندات' },
        avatar: 'D',
        capacityIndex: 0,
        meetingsCount: 0,
        tendersCount: 0,
        submissionsCount: 0,
        assignedEventIds: []
      }
    ];

    // Compute metrics
    events.forEach(e => {
      // Check primary owner match
      const matchingResource = resources.find(r => 
        r.name.en.toLowerCase().includes(e.ownerName.toLowerCase()) ||
        e.assignedToNames.some(name => r.name.en.toLowerCase().includes(name.toLowerCase()))
      );

      if (matchingResource) {
        matchingResource.assignedEventIds.push(e.id);

        // Classify Category
        const isMeeting = [
          EventCategory.KICK_OFF,
          EventCategory.ALIGNMENT_MEETING,
          EventCategory.CLIENT_MEETING,
          EventCategory.INTERNAL_MEETING,
          EventCategory.NEGOTIATION
        ].includes(e.eventType);

        const isTender = e.module === EventModuleType.PRE_AWARD;

        const isSubmission = [
          EventCategory.TECH_SUBMISSION,
          EventCategory.COMM_SUBMISSION,
          EventCategory.CLAIM_DEADLINE,
          EventCategory.IPC_DEADLINE,
          EventCategory.VO_DEADLINE,
          EventCategory.NOC_DEADLINE,
          EventCategory.SUBMITTAL_REVIEW
        ].includes(e.eventType);

        if (isMeeting) matchingResource.meetingsCount++;
        if (isTender) matchingResource.tendersCount++;
        if (isSubmission) matchingResource.submissionsCount++;
      }
    });

    // Calculate Capacity score: (Meetings * 1) + (Active Tenders * 4) + (Submissions * 3)
    resources.forEach(r => {
      r.capacityIndex = (r.meetingsCount * 1) + (r.tendersCount * 4) + (r.submissionsCount * 3);
    });

    return resources;
  }, [events]);

  return resourceWorkloads;
}
