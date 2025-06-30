// 統合ローカルストレージサービス - 全プロジェクトの重複操作を最適化

class StorageService {
  private cache: Map<string, any> = new Map();
  private readonly STORAGE_KEYS = {
    HIDDEN_POSTS: 'hiddenPosts',
    HIDDEN_COMMENTS: 'hiddenComments',
    PROJECT_HISTORY: 'codeGeneratorProjectHistory',
    CLAUDE_PROJECTS: 'claude_projects',
    PROMPTY_PROJECTS: 'prompty-code-projects',
    PRELOADED_IMAGES: 'preloadedImages',
    EMAIL_PROVIDER: 'isEmailProvider',
    USER_SETTINGS: 'userSettings'
  } as const;

  // メモリキャッシュ付きのgetItem
  private getItem<T>(key: string, defaultValue: T): T {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    try {
      const stored = localStorage.getItem(key);
      const parsed = stored ? JSON.parse(stored) : defaultValue;
      this.cache.set(key, parsed);
      return parsed;
    } catch (error) {
      console.error(`Storage read error for key ${key}:`, error);
      return defaultValue;
    }
  }

  // メモリキャッシュ付きのsetItem
  private setItem<T>(key: string, value: T): void {
    try {
      this.cache.set(key, value);
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Storage write error for key ${key}:`, error);
    }
  }

  // キャッシュクリア
  public clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  // ===== 投稿非表示管理 =====
  public getHiddenPosts(): string[] {
    return this.getItem(this.STORAGE_KEYS.HIDDEN_POSTS, []);
  }

  public addHiddenPost(postId: string): void {
    const hiddenPosts = this.getHiddenPosts();
    if (!hiddenPosts.includes(postId)) {
      hiddenPosts.push(postId);
      this.setItem(this.STORAGE_KEYS.HIDDEN_POSTS, hiddenPosts);
    }
  }

  public removeHiddenPost(postId: string): void {
    const hiddenPosts = this.getHiddenPosts();
    const filtered = hiddenPosts.filter(id => id !== postId);
    this.setItem(this.STORAGE_KEYS.HIDDEN_POSTS, filtered);
  }

  public isPostHidden(postId: string): boolean {
    return this.getHiddenPosts().includes(postId);
  }

  // ===== コメント非表示管理 =====
  public getHiddenComments(): string[] {
    return this.getItem(this.STORAGE_KEYS.HIDDEN_COMMENTS, []);
  }

  public addHiddenComment(commentId: string): void {
    const hiddenComments = this.getHiddenComments();
    if (!hiddenComments.includes(commentId)) {
      hiddenComments.push(commentId);
      this.setItem(this.STORAGE_KEYS.HIDDEN_COMMENTS, hiddenComments);
    }
  }

  public removeHiddenComment(commentId: string): void {
    const hiddenComments = this.getHiddenComments();
    const filtered = hiddenComments.filter(id => id !== commentId);
    this.setItem(this.STORAGE_KEYS.HIDDEN_COMMENTS, filtered);
  }

  public setHiddenComments(commentIds: string[]): void {
    this.setItem(this.STORAGE_KEYS.HIDDEN_COMMENTS, commentIds);
  }

  public isCommentHidden(commentId: string): boolean {
    return this.getHiddenComments().includes(commentId);
  }

  // ===== プロジェクト管理 =====
  public getProjectHistory(): any[] {
    return this.getItem(this.STORAGE_KEYS.PROJECT_HISTORY, []);
  }

  public addProjectToHistory(project: any): void {
    const history = this.getProjectHistory();
    history.unshift(project);
    if (history.length > 50) {
      history.splice(50);
    }
    this.setItem(this.STORAGE_KEYS.PROJECT_HISTORY, history);
  }

  public clearProjectHistory(): void {
    this.setItem(this.STORAGE_KEYS.PROJECT_HISTORY, []);
  }

  // ===== Claude プロジェクト =====
  public getClaudeProjects(): any[] {
    return this.getItem(this.STORAGE_KEYS.CLAUDE_PROJECTS, []);
  }

  public addClaudeProject(project: any): string {
    const projectId = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const projectData = {
      ...project,
      id: projectId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const projects = this.getClaudeProjects();
    projects.push(projectData);
    this.setItem(this.STORAGE_KEYS.CLAUDE_PROJECTS, projects);
    
    return projectId;
  }

  public deleteClaudeProject(projectId: string): boolean {
    const projects = this.getClaudeProjects();
    const filtered = projects.filter(p => p.id !== projectId);
    this.setItem(this.STORAGE_KEYS.CLAUDE_PROJECTS, filtered);
    return true;
  }

  // ===== Prompty プロジェクト =====
  public getPromptyProjects(): any[] {
    return this.getItem(this.STORAGE_KEYS.PROMPTY_PROJECTS, []);
  }

  public addPromptyProject(project: any): void {
    const projects = this.getPromptyProjects();
    projects.unshift(project); // 最新を先頭に
    this.setItem(this.STORAGE_KEYS.PROMPTY_PROJECTS, projects);
  }

  // ===== 画像プリロード管理 =====
  public getPreloadedImages(): Set<string> {
    const array = this.getItem(this.STORAGE_KEYS.PRELOADED_IMAGES, []);
    return new Set(array);
  }

  public addPreloadedImage(imageUrl: string): void {
    const images = this.getPreloadedImages();
    images.add(imageUrl);
    this.setItem(this.STORAGE_KEYS.PRELOADED_IMAGES, Array.from(images));
  }

  public isImagePreloaded(imageUrl: string): boolean {
    return this.getPreloadedImages().has(imageUrl);
  }

  // ===== ユーザー設定 =====
  public getEmailProviderFlag(): boolean {
    const value = this.getItem(this.STORAGE_KEYS.EMAIL_PROVIDER, false);
    return typeof value === 'string' ? value === 'true' : value;
  }

  public setEmailProviderFlag(isProvider: boolean): void {
    this.setItem(this.STORAGE_KEYS.EMAIL_PROVIDER, isProvider.toString());
  }

  public removeEmailProviderFlag(): void {
    localStorage.removeItem(this.STORAGE_KEYS.EMAIL_PROVIDER);
    this.cache.delete(this.STORAGE_KEYS.EMAIL_PROVIDER);
  }

  // ===== 汎用ユーザー設定 =====
  public getUserSettings(): Record<string, any> {
    return this.getItem(this.STORAGE_KEYS.USER_SETTINGS, {});
  }

  public setUserSetting(key: string, value: any): void {
    const settings = this.getUserSettings();
    settings[key] = value;
    this.setItem(this.STORAGE_KEYS.USER_SETTINGS, settings);
  }

  public getUserSetting(key: string, defaultValue: any = null): any {
    const settings = this.getUserSettings();
    return settings[key] ?? defaultValue;
  }

  // ===== デバッグ・メンテナンス =====
  public getStorageUsage(): Record<string, number> {
    const usage: Record<string, number> = {};
    
    Object.values(this.STORAGE_KEYS).forEach(key => {
      try {
        const value = localStorage.getItem(key);
        usage[key] = value ? value.length : 0;
      } catch (error) {
        usage[key] = 0;
      }
    });
    
    return usage;
  }

  public clearAllStorage(): void {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    this.cache.clear();
  }

  // ===== リアクティブ更新通知 =====
  private listeners: Map<string, ((value: any) => void)[]> = new Map();

  public subscribe(key: string, callback: (value: any) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key)!.push(callback);

    // アンサブスクライブ関数を返す
    return () => {
      const callbacks = this.listeners.get(key);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  private notifyListeners(key: string, value: any): void {
    const callbacks = this.listeners.get(key);
    if (callbacks) {
      callbacks.forEach(callback => callback(value));
    }
  }

  // setItemをオーバーライドして通知機能を追加
  private setItemWithNotification<T>(key: string, value: T): void {
    this.setItem(key, value);
    this.notifyListeners(key, value);
  }
}

// シングルトンインスタンス
export const storageService = new StorageService();

// 便利な型定義
export type StorageKey = keyof typeof storageService['STORAGE_KEYS'];

// React Hook用のエクスポート
export { StorageService }; 