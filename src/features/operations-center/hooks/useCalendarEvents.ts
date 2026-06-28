import { useState, useEffect, useCallback, useMemo } from 'react';
import { CalendarEvent, EventModuleType, EventPriority, EventStatus } from '../types';
import { OperationsCenterService } from '../services/OperationsCenterService';

const service = new OperationsCenterService();

export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModuleFilters, setSelectedModuleFilters] = useState<EventModuleType[]>([]);
  const [selectedPriorityFilters, setSelectedPriorityFilters] = useState<EventPriority[]>([]);
  const [selectedProjectFilters, setSelectedProjectFilters] = useState<string[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Load synthesized events
  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await service.fetchSynthesizedEvents();
      setEvents(data);
    } catch (e) {
      console.error('Error fetching calendar events in hook:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Unique Projects for filtering
  const projectList = useMemo(() => {
    const list = new Set<string>();
    events.forEach(e => {
      if (e.projectCode) list.add(e.projectCode);
    });
    return Array.from(list);
  }, [events]);

  // Handle Event Date Rescheduling with Propagation
  const rescheduleEvent = useCallback(async (eventId: string, newStart: string, newEnd: string) => {
    setEvents(prevEvents => {
      const updatedEvents = service.propagateRescheduling(prevEvents, eventId, newStart, newEnd);
      
      // Save all updated events back to storage asynchronously
      const changedIds = prevEvents.reduce((acc, original) => {
        const matching = updatedEvents.find(u => u.id === original.id);
        if (matching && (matching.startDate !== original.startDate || matching.endDate !== original.endDate)) {
          acc.push(matching);
        }
        return acc;
      }, [] as CalendarEvent[]);

      // Batch save
      Promise.all(changedIds.map(ev => service.saveEvent(ev))).then(() => {
        // Trigger a quiet reload to ensure accurate state synchronization across windows
        service.fetchSynthesizedEvents().then(latest => setEvents(latest));
      });

      return updatedEvents;
    });
  }, []);

  // Handle direct Event modifications
  const updateEventDetails = useCallback(async (updatedEvent: CalendarEvent) => {
    setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
    await service.saveEvent(updatedEvent);
    // Quiet refetch to synchronize DAG dependencies
    const latest = await service.fetchSynthesizedEvents();
    setEvents(latest);
  }, []);

  // Complete an event directly
  const completeEvent = useCallback(async (eventId: string) => {
    const target = events.find(e => e.id === eventId);
    if (target) {
      const cloned = { ...target, status: EventStatus.COMPLETED };
      await updateEventDetails(cloned);
    }
  }, [events, updateEventDetails]);

  // Reassign owner
  const reassignEventOwner = useCallback(async (eventId: string, ownerName: string) => {
    const target = events.find(e => e.id === eventId);
    if (target) {
      const cloned = { ...target, ownerName };
      await updateEventDetails(cloned);
    }
  }, [events, updateEventDetails]);

  // Add notes/comments
  const addEventNote = useCallback(async (eventId: string, authorName: string, text: string) => {
    const target = events.find(e => e.id === eventId);
    if (target) {
      const newNote = {
        id: `note-${Date.now()}`,
        authorName,
        timestamp: new Date().toISOString().split('T')[0],
        text
      };
      const cloned = {
        ...target,
        notes: [newNote, ...target.notes]
      };
      await updateEventDetails(cloned);
    }
  }, [events, updateEventDetails]);

  // Attach a new file
  const attachFileToEvent = useCallback(async (eventId: string, fileName: string, fileSize: string) => {
    const target = events.find(e => e.id === eventId);
    if (target) {
      const newAttachment = {
        id: `att-${Date.now()}`,
        fileName,
        fileSize,
        uploadedBy: 'Active User',
        uploadDate: new Date().toISOString().split('T')[0],
        downloadUrl: '#'
      };
      const cloned = {
        ...target,
        attachments: [...target.attachments, newAttachment]
      };
      await updateEventDetails(cloned);
    }
  }, [events, updateEventDetails]);

  // Add Manual custom event
  const createManualEvent = useCallback(async (eventData: Omit<CalendarEvent, 'id' | 'hasConflict'>) => {
    const newEvent = await service.createManualEvent(eventData);
    setEvents(prev => [...prev, newEvent]);
    return newEvent;
  }, []);

  // Filtered Events computed property
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      // 1. Search Query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = e.title.en.toLowerCase().includes(query) || e.title.ar.includes(query);
        const matchesDesc = e.description?.en?.toLowerCase().includes(query) || e.description?.ar?.includes(query);
        const matchesProject = e.projectName.en.toLowerCase().includes(query) || e.projectCode.toLowerCase().includes(query);
        const matchesOwner = e.ownerName.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesProject && !matchesOwner) {
          return false;
        }
      }

      // 2. Module filters
      if (selectedModuleFilters.length > 0 && !selectedModuleFilters.includes(e.module)) {
        return false;
      }

      // 3. Priority filters
      if (selectedPriorityFilters.length > 0 && !selectedPriorityFilters.includes(e.priority)) {
        return false;
      }

      // 4. Project filters
      if (selectedProjectFilters.length > 0 && !selectedProjectFilters.includes(e.projectCode)) {
        return false;
      }

      return true;
    });
  }, [events, searchQuery, selectedModuleFilters, selectedPriorityFilters, selectedProjectFilters]);

  const selectedEvent = useMemo(() => {
    return events.find(e => e.id === selectedEventId) || null;
  }, [events, selectedEventId]);

  return {
    events,
    filteredEvents,
    projectList,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedModuleFilters,
    setSelectedModuleFilters,
    selectedPriorityFilters,
    setSelectedPriorityFilters,
    selectedProjectFilters,
    setSelectedProjectFilters,
    selectedEventId,
    setSelectedEventId,
    selectedEvent,
    rescheduleEvent,
    updateEventDetails,
    completeEvent,
    reassignEventOwner,
    addEventNote,
    attachFileToEvent,
    createManualEvent,
    refresh: loadEvents
  };
}
