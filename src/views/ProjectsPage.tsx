import React, { useState } from 'react';
import { ProjectList } from '../features/projects/components/ProjectList';
import { AddProject } from '../features/projects/components/AddProject';
import { MasterRegisters } from '../features/projects/components/MasterRegisters';
import { ProjectWorkspace } from '../features/projects/components/ProjectWorkspace';
import { useProjects } from '../hooks/useProjects';
import { ProjectLookupService } from '../services/ProjectLookupService';
import { Project } from '../domain/projects/Project';
import { RecordStatus } from '../enums/RecordStatus';

interface ProjectsPageProps {
  lang: 'ar' | 'en';
  settings?: any;
}

export function ProjectsPage({
  lang,
  settings
}: ProjectsPageProps) {
  const { projects, saveProject, refreshProjects } = useProjects();
  const isAr = lang === 'ar';

  // Navigation states: 'list' | 'add' | 'masters' | 'workspace'
  const [viewState, setViewState] = useState<'list' | 'add' | 'masters' | 'workspace'>('list');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedProjectForForm, setSelectedProjectForForm] = useState<Project | null>(null);

  const handleSaveProject = async (newProj: Project) => {
    const isEdit = formMode === 'edit';
    const success = await saveProject(newProj);
    if (success) {
      await ProjectLookupService.getInstance().addHistory(
        newProj.id,
        isEdit ? 'Project Details Updated' : 'Project Registered',
        'System',
        isEdit ? `Updated project details: ${newProj.code}` : `Registered project code: ${newProj.code}`
      );
      setViewState('list');
      setFormMode('create');
      setSelectedProjectForForm(null);
    }
  };

  const handleEditProject = (project: Project) => {
    setSelectedProjectForForm(project);
    setFormMode('edit');
    setViewState('add');
  };

  const handleViewProject = (project: Project) => {
    setSelectedProjectForForm(project);
    setFormMode('view');
    setViewState('add');
  };

  const handleArchiveProject = async (project: Project, reason: string) => {
    const updated = {
      ...project,
      recordStatus: RecordStatus.ARCHIVED,
      archiveInfo: {
        archivedBy: 'User',
        archivedAt: new Date().toISOString(),
        archiveReason: reason
      }
    };
    const success = await saveProject(updated);
    if (success) {
      await ProjectLookupService.getInstance().addHistory(
        project.id,
        'Project Archived',
        'System',
        `Archived project code: ${project.code}. Reason: ${reason}`
      );
      refreshProjects();
    }
  };

  const handleRestoreProject = async (project: Project) => {
    const updated = {
      ...project,
      recordStatus: RecordStatus.ACTIVE,
      archiveInfo: undefined
    };
    const success = await saveProject(updated);
    if (success) {
      await ProjectLookupService.getInstance().addHistory(
        project.id,
        'Project Restored',
        'System',
        `Restored project code: ${project.code}`
      );
      refreshProjects();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      
      {/* Dynamic Header Titles based on routing state */}
      {viewState === 'list' && (
        <div className="space-y-1.5 mb-8">
          <h1 className="text-3xl font-black text-brand-navy dark:text-slate-100 tracking-tight">
            {isAr ? 'محفظة وإدارة المشاريع' : 'Projects Portfolio Workspace'}
          </h1>
          <p className="text-slate-400 text-xs">
            {isAr 
              ? 'مستودع السجلات والمستخلصات والأوامر التغييرية والمطالبات المرتبطة بجميع المشروعات النشطة وقبل الترسية.'
              : 'Central hub for project master records, contract payments, claims, and regulatory permits.'
            }
          </p>
        </div>
      )}

      {/* Screen router */}
      {viewState === 'list' && (
        <ProjectList
          projects={projects}
          lang={lang}
          onSelectProject={(id) => {
            setSelectedProjectId(id);
            setViewState('workspace');
          }}
          onAddNew={() => {
            setSelectedProjectForForm(null);
            setFormMode('create');
            setViewState('add');
          }}
          onViewMasters={() => setViewState('masters')}
          onEditProject={handleEditProject}
          onArchiveProject={handleArchiveProject}
          onRestoreProject={handleRestoreProject}
        />
      )}

      {viewState === 'add' && (
        <AddProject
          lang={lang}
          mode={formMode}
          entity={selectedProjectForForm}
          onSave={handleSaveProject}
          onCancel={() => {
            setSelectedProjectForForm(null);
            setFormMode('create');
            setViewState('list');
          }}
        />
      )}

      {viewState === 'masters' && (
        <MasterRegisters
          lang={lang}
          onBack={() => setViewState('list')}
        />
      )}

      {viewState === 'workspace' && selectedProjectId && (
        <ProjectWorkspace
          projectId={selectedProjectId}
          lang={lang}
          onBack={() => {
            setSelectedProjectId('');
            setViewState('list');
            refreshProjects();
          }}
        />
      )}

    </div>
  );
}
