export abstract class BaseMigration {
  public abstract readonly version: number;
  public abstract readonly description: string;
  public abstract up(): Promise<boolean>;
}
