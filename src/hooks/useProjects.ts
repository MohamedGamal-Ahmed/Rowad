import { useState, useEffect, useCallback } from 'react';
import { Project } from '../domain/projects/Project';
import { ProjectLookupService } from '../services/ProjectLookupService';

const lookupService = ProjectLookupService.getInstance();

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    try {
      if (forceRefresh) {
        await lookupService.refresh();
      }
      const list = await lookupService.getProjects(forceRefresh);
      setProjects(list);
    } catch (e) {
      console.error('Error loading projects in useProjects hook:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const saveProject = useCallback(async (project: Project) => {
    setLoading(true);
    try {
      const success = await lookupService.saveProject(project);
      if (success) {
        await fetchProjects(true); // force refresh list after saving
      }
      return success;
    } catch (e) {
      console.error('Error saving project in useProjects hook:', e);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchProjects]);

  return {
    projects,
    loading,
    refreshProjects: () => fetchProjects(true),
    saveProject
  };
}
