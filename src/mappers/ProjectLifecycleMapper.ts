import { ProjectLifecycleStage } from '../domain/projects/Project';

export class ProjectLifecycleMapper {
  /**
   * Translates a string representation of a lifecycle stage to the ProjectLifecycleStage enum.
   */
  public static toEnum(stage: string | undefined): ProjectLifecycleStage {
    if (!stage) {
      return ProjectLifecycleStage.PENDING_PROJECT_SETUP;
    }
    const cleanStage = stage.trim();
    switch (cleanStage) {
      case 'Pre-Award':
      case 'PRE_AWARD':
        return ProjectLifecycleStage.PRE_AWARD;
      case 'Pending Project Setup':
      case 'PENDING_PROJECT_SETUP':
        return ProjectLifecycleStage.PENDING_PROJECT_SETUP;
      case 'Pending Activation':
      case 'PENDING_ACTIVATION':
        return ProjectLifecycleStage.PENDING_PROJECT_SETUP;
      case 'Ready for Mobilization':
      case 'READY_FOR_MOBILIZATION':
        return ProjectLifecycleStage.READY_FOR_MOBILIZATION;
      case 'Execution':
      case 'EXECUTION':
        return ProjectLifecycleStage.EXECUTION;
      case 'Closing':
      case 'CLOSING':
      case 'Substantial Completion':
      case 'Final Completion':
        return ProjectLifecycleStage.CLOSING;
      case 'Archived':
      case 'ARCHIVED':
        return ProjectLifecycleStage.ARCHIVED;
      default:
        return ProjectLifecycleStage.PENDING_PROJECT_SETUP;
    }
  }

  /**
   * Returns string representation of enum value.
   */
  public static toString(stage: ProjectLifecycleStage): string {
    return stage;
  }
}
