import { useMemo } from 'react';
import { CalendarEvent } from '../types';

export interface ProjectTimelineGroup {
  projectCode: string;
  projectName: { en: string; ar: string };
  startDate: string;
  endDate: string;
  events: CalendarEvent[];
}

export function useTimeline(events: CalendarEvent[]) {
  const timelineGroups = useMemo(() => {
    const groups: { [key: string]: CalendarEvent[] } = {};
    
    // Group events by project
    events.forEach(e => {
      const code = e.projectCode || 'OTHER';
      if (!groups[code]) {
        groups[code] = [];
      }
      groups[code].push(e);
    });

    const projectTimelines: ProjectTimelineGroup[] = Object.keys(groups).map(code => {
      const pEvents = groups[code];
      const pName = pEvents[0]?.projectName || { en: 'Project', ar: 'المشروع' };

      // Find overall project bounds from events
      let minDate = '';
      let maxDate = '';

      pEvents.forEach(e => {
        if (!minDate || e.startDate < minDate) minDate = e.startDate;
        if (!maxDate || e.endDate > maxDate) maxDate = e.endDate;
      });

      // Sort events chronologically inside project
      const sortedEvents = [...pEvents].sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );

      return {
        projectCode: code,
        projectName: pName,
        startDate: minDate,
        endDate: maxDate,
        events: sortedEvents
      };
    });

    return projectTimelines;
  }, [events]);

  return timelineGroups;
}
